import { useState, useEffect } from 'react';
import MainTemplate from '../MainTemplate';
import apiService from '../../services/service';
import '../../styles/DocumentRequest.css';

export default function PurokDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requestData: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => { fetchPurokRequests(); }, []);

    const fetchPurokRequests = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPurokPendingRequests();
            setRequests(response.requests || []);
            setError(null);
        } catch (err) {
            setError('Error fetching Purok requests. Server might be waking up.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await apiService.purokApproveRequest(id);
            alert("✅ Approved! The request is now sent to the Barangay Admin.");
            fetchPurokRequests();
        } catch (err) {
            alert("Failed to approve: " + err.message);
        }
    };

    const handleReject = async () => {
        try {
            await apiService.purokRejectRequest(rejectionModal.requestData._id, rejectReason);
            alert("❌ Request Rejected.");
            setRejectionModal({ isOpen: false, requestData: null });
            setRejectReason('');
            fetchPurokRequests();
        } catch (err) {
            alert("Failed to reject: " + err.message);
        }
    };

    return (
        <MainTemplate headerName={"Purok Dashboard"} cardHeader={"Purok President Approval"}>
            <div className="main-container">
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
                                    <th>Purpose</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 ? (
                                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No pending requests for your Purok.</td></tr>
                                ) : (
                                    requests.map((request) => (
                                        <tr key={request._id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{request.fullName}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{request.phoneNumber}</div>
                                            </td>
                                            <td>{request.documentType}</td>
                                            <td>{request.purpose}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleApprove(request._id)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                        Approve
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

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Request</h3>
                        <p>Why are you rejecting {rejectionModal.requestData?.fullName}'s request?</p>
                        <textarea 
                            value={rejectReason} 
                            onChange={(e) => setRejectReason(e.target.value)} 
                            placeholder="Enter reason..."
                            style={{ width: '100%', height: '80px', marginBottom: '15px', padding: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setRejectionModal({ isOpen: false, requestData: null })} className="cancel-button">Cancel</button>
                            <button onClick={handleReject} className="reject-button">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </MainTemplate>
    );
}