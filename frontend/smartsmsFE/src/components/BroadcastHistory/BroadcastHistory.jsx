import { useState, useEffect } from 'react'
import service from '../../services/service';
import MainTemplate from '../MainTemplate'
import '../../styles/BroadcastHistory.css'
import { FaTrash } from 'react-icons/fa';

export default function BroadcastHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = async () => {
        try {
            const response = await service.getBroadcastHistory()
            setHistory(response);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this broadcast record? This action cannot be undone.")) return;
        
        try {
            await service.deleteBroadcastHistory(id);
            fetchHistory(); // Refresh list after delete
        } catch (err) {
            alert("Failed to delete broadcast history: " + err.message);
        }
    };

    if (loading) {
        return (
            <MainTemplate headerName="Broadcast History" cardHeader="Broadcast History">
                <div className="main-container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                </div>
            </MainTemplate>
        );
    }

    if (error) {
        return (
            <MainTemplate headerName="Broadcast History" cardHeader="Broadcast History">
                <div className="main-container">
                    <div className="error-message">Error: {error}</div>
                </div>
            </MainTemplate>
        );
    }

    return (
        <MainTemplate headerName="Broadcast History" cardHeader="Broadcast History">
            <div className="main-container">
                <div className="table-wrapper">
                    <div className="table-scroll-container">
                        <table className="broadcast-history-table">
                            <thead>
                                <tr>
                                    <th>Recipients</th>
                                    <th>Broadcast Type</th>
                                    <th>Message</th>
                                    <th>Message ID</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="no-data-message">No broadcast history available</div>
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item) => (
                                        <tr key={item._id}>
                                            <td>{item.phoneNumbers.length}</td>
                                            <td>{item.broadcastType || 'N/A'}</td>
                                            <td>{item.message}</td>
                                            <td>{item.messageId || 'N/A'}</td>
                                            <td>
                                                {new Date(new Date(item.createdAt).getTime() - 8 * 60 * 60 * 1000).toLocaleString('en-PH', {
                                                    timeZone: 'Asia/Manila',
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })}
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => handleDelete(item._id)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                                                    title="Delete Record"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainTemplate>
    );
}