import { useState, useEffect } from 'react';
import MainTemplate from '../MainTemplate';
import apiService from '../../services/service';
import ApprovalModal from './ApprovalModal';
import RejectionModal from './RejectionModal';
import '../../styles/DocumentRequest.css';

export default function DocumentRequest() {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvalModal, setApprovalModal] = useState({ isOpen: false, requestData: null });
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requestData: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); 

    useEffect(() => { fetchRequests(); }, []);

    useEffect(() => {
        let filtered = [...requests];
        if (searchTerm) {
            filtered = filtered.filter(request =>
                request.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(request => request.status === statusFilter);
        }
        setFilteredRequests(filtered);
    }, [requests, searchTerm, statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllDocumentRequests(); 
            const requestData = response?.requests || response || [];
            setRequests(Array.isArray(requestData) ? requestData : []);
            setError(null);
        } catch (err) {
            setError('Error fetching document requests. Server might be waking up.');
        } finally {
            setLoading(false);
        }
    };

    // FINAL Barangay Approval (Sends SMS)
    const handleFinalApprove = async (id, approvalDetails) => {
        try {
            await apiService.updateDocumentRequestStatus(id, 'approved', { approvalDetails });
            setRequests(requests.map(r => r._id === id ? { ...r, status: 'approved' } : r));
        } catch (err) {
            throw err;
        }
    };

    const handleReject = async (id, reason) => {
        try {
            await apiService.updateDocumentRequestStatus(id, 'rejected', { rejectionReason: reason });
            setRequests(requests.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
        } catch (err) {
            setError(`Error rejecting: ${err?.message}`);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span style={{background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>PENDING PUROK</span>;
            case 'pending_barangay': return <span style={{background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>PUROK APPROVED (FOR BRGY)</span>;
            case 'approved': return <span style={{background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>COMPLETED</span>;
            case 'rejected': return <span style={{background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>REJECTED</span>;
            default: return status;
        }
    };

    return (
        <MainTemplate headerName={"Document Request"} cardHeader={"Document Request Management"}>
            <div className="main-container">
                <div className="filters-container" style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f8fafc', marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}
                    />
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    >
                        <option value="all">Show All Requests</option>
                        <option value="pending">Pending Purok</option>
                        <option value="pending_barangay">Purok Approved (For Final)</option>
                        <option value="approved">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p style={{marginTop: '10px', color: '#666'}}>Loading requests...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Requester Info</th>
                                    <th>Document</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length === 0 ? (
                                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No requests found for this filter.</td></tr>
                                ) : (
                                    filteredRequests.map((request) => (
                                        <tr key={request._id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{request.fullName}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{request.phoneNumber}</div>
                                            </td>
                                            <td>{request.documentType}</td>
                                            <td>{getStatusBadge(request.status)}</td>
                                            <td>
                                                {/* SHOW ACTIONS IF STATUS IS PENDING OR PENDING_BARANGAY */}
                                                {(request.status === 'pending' || request.status === 'pending_barangay') && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => setApprovalModal({ isOpen: true, requestData: request })} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                            Final Approve & Send SMS
                                                        </button>
                                                        <button onClick={() => setRejectionModal({ isOpen: true, requestData: request })} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ApprovalModal 
                isOpen={approvalModal.isOpen} 
                onClose={() => setApprovalModal({ isOpen: false, requestData: null })} 
                onApprove={handleFinalApprove} 
                requestData={approvalModal.requestData} 
            />
            
            <RejectionModal 
                isOpen={rejectionModal.isOpen} 
                onClose={() => setRejectionModal({ isOpen: false, requestData: null })} 
                onReject={handleReject} 
                requestData={rejectionModal.requestData} 
            />
        </MainTemplate>
    );
}