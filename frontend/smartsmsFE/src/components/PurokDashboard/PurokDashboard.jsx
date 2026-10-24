import { useState, useEffect, useRef } from 'react';
import MainTemplate from '../MainTemplate';
import apiService from '../../services/service';
import '../../styles/DocumentRequest.css';

export default function PurokDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requestData: null });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // State for real-time alerts
    const [newRequestAlert, setNewRequestAlert] = useState(false);
    const previousCount = useRef(0);

    useEffect(() => { 
        fetchPurokRequests(); 
        
        // Poll every 10 seconds for new requests
        const interval = setInterval(() => {
            fetchPurokRequests(true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchPurokRequests = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            
            const response = await apiService.getPurokPendingRequests();
            const newRequests = response.requests || [];

            // If we are in the background and the number of requests increased, show an alert
            if (isBackground && newRequests.length > previousCount.current) {
                setNewRequestAlert(true);
                // Optional: Play a sound or vibrate phone
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }

            previousCount.current = newRequests.length;
            setRequests(newRequests);
            setError(null);
        } catch (err) {
            if (!isBackground) setError('Error fetching Purok requests.');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setActionLoading(true);
            await apiService.purokApproveRequest(id);
            alert("✅ Approved! The resident has been texted to pick up their Purok Clearance.");
            fetchPurokRequests(); // Refresh immediately after approving
        } catch (err) {
            alert("Failed to approve: " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setActionLoading(true);
            await apiService.purokRejectRequest(rejectionModal.requestData._id, rejectReason);
            alert("❌ Request Rejected.");
            setRejectionModal({ isOpen: false, requestData: null });
            setRejectReason('');
            fetchPurokRequests(); // Refresh immediately after rejecting
        } catch (err) {
            alert("Failed to reject: " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <MainTemplate headerName={"Purok Dashboard"} cardHeader={"Purok President Approval"}>
            <div className="main-container">
                
                {/* MOBILE REAL-TIME NOTIFICATION BANNER */}
                {newRequestAlert && (
                    <div style={{ background: '#10b981', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.5s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-bell fa-shake" style={{ fontSize: '24px' }}></i>
                            <strong style={{ fontSize: '16px' }}>New Request Arrived!</strong>
                        </div>
                        <button 
                            onClick={() => setNewRequestAlert(false)} 
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

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
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button 
                                                        onClick={() => handleApprove(request._id)} 
                                                        disabled={actionLoading}
                                                        style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, width: '100%' }}
                                                    >
                                                        {actionLoading ? '...' : 'Approve & Send SMS'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setRejectionModal({ isOpen: true, requestData: request })} 
                                                        disabled={actionLoading}
                                                        style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, width: '100%' }}
                                                    >
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
                    <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }}>
                        <h3>Reject Request</h3>
                        <p>Why are you rejecting {rejectionModal.requestData?.fullName}'s request?</p>
                        <textarea 
                            value={rejectReason} 
                            onChange={(e) => setRejectReason(e.target.value)} 
                            placeholder="Enter reason..."
                            style={{ width: '100%', height: '80px', marginBottom: '15px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
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