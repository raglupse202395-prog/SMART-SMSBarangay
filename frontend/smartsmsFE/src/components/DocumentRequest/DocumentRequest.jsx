import { useState, useEffect, useRef } from 'react';
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
    
    // State for notifications
    const [newRequestAlert, setNewRequestAlert] = useState(false);
    const previousCount = useRef(0);

    useEffect(() => { 
        fetchRequests(); 
        
        // Set up real-time polling every 10 seconds
        const interval = setInterval(() => {
            fetchRequests(true); // pass true to indicate silent background fetch
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = [...requests];
        
        // Filter out APPROVED and REJECTED
        filtered = filtered.filter(request => 
            request.status !== 'approved' && request.status !== 'rejected'
        );

        if (searchTerm) {
            filtered = filtered.filter(request =>
                request.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredRequests(filtered);
    }, [requests, searchTerm]);

    const fetchRequests = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            
            const response = await apiService.getAllDocumentRequests(); 
            const requestData = response?.requests || response || [];
            
            // Only show PENDING/PENDING_BARANGAY for the admin
            const pendingRequests = Array.isArray(requestData) 
                ? requestData.filter(r => r.status !== 'approved' && r.status !== 'rejected') 
                : [];

            // Check if a new request arrived
            if (isBackground && pendingRequests.length > previousCount.current) {
                setNewRequestAlert(true);
                // Play a sound (optional)
                // new Audio('/notification.mp3').play().catch(e => console.log('Audio blocked'));
            }
            
            previousCount.current = pendingRequests.length;
            setRequests(Array.isArray(requestData) ? requestData : []);
            setError(null);
        } catch (err) {
            if (!isBackground) setError('Error fetching document requests. Server might be waking up.');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

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
            default: return status;
        }
    };

    return (
        <MainTemplate headerName={"Document Request"} cardHeader={"Document Request Management"}>
            <div className="main-container">
                
                {/* REAL-TIME NOTIFICATION BANNER */}
                {newRequestAlert && (
                    <div style={{ background: '#10b981', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.5s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-bell fa-shake" style={{ fontSize: '20px' }}></i>
                            <strong>New Document Request Arrived!</strong>
                        </div>
                        <button 
                            onClick={() => setNewRequestAlert(false)} 
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="filters-container" style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f8fafc', marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}
                    />
                    <button onClick={() => fetchRequests()} style={{ padding: '10px 20px', background: '#0038A8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Refresh
                    </button>
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
                                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No pending requests found.</td></tr>
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
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => setApprovalModal({ isOpen: true, requestData: request })} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                        Final Approve & Send SMS
                                                    </button>
                                                    <button onClick={() => setRejectionModal({ isOpen: true, requestData: request })} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                        Reject
                                                    </button>
                                                </div>
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