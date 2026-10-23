import { useState, useEffect } from 'react';
import MainTemplate from '../MainTemplate';
import apiService from '../../services/service';
import '../../styles/DocumentRequest.css';

export default function RequestHistory() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => { 
        fetchRequests(); 
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryFetch = async () => {
            try {
                attempts++;
                const response = await apiService.getAllDocumentRequests();
                
                let requestData = [];
                if (Array.isArray(response)) {
                    requestData = response;
                } else if (response && Array.isArray(response.requests)) {
                    requestData = response.requests;
                }

                const filteredData = requestData.filter(request => 
                    request.status === 'approved' || 
                    request.status === 'rejected' || 
                    request.status === 'purok_approved'
                );
                
                setRequests(filteredData);
                setLoading(false);
            } catch (err) {
                console.error(`Attempt ${attempts} failed:`, err);
                
                if (attempts < maxAttempts) {
                    console.log("Retrying in 5 seconds...");
                    setTimeout(tryFetch, 5000); 
                } else {
                    setError('Error fetching document requests. The server might be waking up. Please refresh the page.');
                    setRequests([]);
                    setLoading(false);
                }
            }
        };

        tryFetch();
    };

    const handleView = (request) => {
        const details = [
            `Name: ${request.fullName || 'N/A'}`,
            `Email: ${request.email || 'N/A'}`,
            `Phone: ${request.phoneNumber || 'N/A'}`,
            `Address: ${request.address || 'N/A'}`,
            `Document Type: ${request.documentType || 'N/A'}`,
            `Purpose: ${request.purpose || 'N/A'}`,
            `Status: ${request.status || 'N/A'}`,
            `Date: ${request.createdAt ? new Date(new Date(request.createdAt).getTime() - 8 * 60 * 60 * 1000).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
                hour: 'numeric', minute: '2-digit', hour12: true,
            }) : 'N/A'}`
        ];

        if (request.status === 'approved' && request.approvalDetails) {
            details.push('', '--- APPROVAL DETAILS ---');
            if (request.approvalDetails.pickupDate) details.push(`Pickup Date: ${new Date(request.approvalDetails.pickupDate).toLocaleDateString('en-PH')}`);
            if (request.approvalDetails.pickupTime) details.push(`Pickup Time: ${request.approvalDetails.pickupTime}`);
            if (request.approvalDetails.officeHours) details.push(`Office Hours: ${request.approvalDetails.officeHours}`);
            if (request.approvalDetails.instructions) details.push(`Instructions: ${request.approvalDetails.instructions}`);
        }

        if (request.status === 'rejected' && request.rejectionReason) {
            details.push('', '--- REJECTION REASON ---');
            details.push(request.rejectionReason);
        }
        alert(details.join('\n'));
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'purok_approved': return 'status-pending';
            default: return 'status-default';
        }
    };

    const filteredRequests = Array.isArray(requests)
        ? (filterStatus === 'all' ? requests : requests.filter(request => request.status === filterStatus))
        : [];

    return (
        <MainTemplate headerName={"Request History"} cardHeader={"Request History"}>
            <div className="main-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p style={{marginTop: '10px', color: '#666'}}>Waking up server (this takes 30-50 seconds)...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        {error}
                        <br/><br/>
                        <button onClick={fetchRequests} style={{padding: '10px 20px', background: '#0038A8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Try Again</button>
                    </div>
                ) : (
                    <>
                        <div className="filters-container">
                            <div className="filter-controls">
                                <div className="filter-group">
                                    <label htmlFor="statusFilter">Status:</label>
                                    <select id="statusFilter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                                        <option value="all">All</option>
                                        <option value="approved">Approved (Ready)</option>
                                        <option value="purok_approved">Purok Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="results-summary">
                            Showing {filteredRequests.length} of {requests.length} requests
                        </div>
                        <div className="table-wrapper">
                            <div className="table-scroll-container">
                                <table className="requests-table">
                                    <thead>
                                        <tr>
                                            <th>Requester Info</th>
                                            <th>Document Type</th>
                                            <th>Purpose</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length > 0 ? (
                                            filteredRequests.map((request) => (
                                                <tr key={request._id || Math.random().toString()}>
                                                    <td>
                                                        <div className="requester-info">
                                                            <div className="requester-name">{request.fullName || 'N/A'}</div>
                                                            <div className="requester-email">{request.email || 'N/A'}</div>
                                                            <div className="requester-phone">{request.phoneNumber || 'N/A'}</div>
                                                        </div>
                                                    </td>
                                                    <td>{request.documentType || 'N/A'}</td>
                                                    <td><div className="purpose-text">{request.purpose || 'N/A'}</div></td>
                                                    <td><span className={`status-badge ${getStatusClass(request.status)}`}>{request.status || 'unknown'}</span></td>
                                                    <td>
                                                        {request.createdAt ? new Date(new Date(request.createdAt).getTime() - 8 * 60 * 60 * 1000).toLocaleString('en-PH', {
                                                            timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: 'numeric', minute: '2-digit', hour12: true,
                                                        }) : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button onClick={() => handleView(request)} className="view-button">
                                                                <i className="fas fa-eye"></i> View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6">
                                                    <div className="no-requests-message">
                                                        No document requests found.
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainTemplate>
    );
}