import { useState, useEffect } from 'react';
import MainTemplate from '../MainTemplate';
import { FaEnvelope, FaFileAlt, FaUsers, FaBell } from 'react-icons/fa';
import services from '../../services/service';
import '../../styles/Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSMS: 0,
    pendingRequests: 0,
    registeredResidents: 0,
    announcements: 0
  });

  const [broadcasts, setBroadcasts] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch residents (already returns array from service.js)
        const residentsResponse = await services.getResidents();
        const residentsCount = residentsResponse.length || 0;

        // Fetch broadcasts
        const broadcastHistory = await services.getBroadcastHistory();
        const broadcastData = Array.isArray(broadcastHistory) ? broadcastHistory : [];

        // Fetch document requests
        const requestsResponse = await services.getAllDocumentRequests();
        const pendingRequestsResponse = await services.getPendingDocumentRequests();

        const allRequests = requestsResponse?.requests || [];
        const pendingRequests = pendingRequestsResponse?.count || 0;

        setStats({
          totalSMS: broadcastData.length,
          pendingRequests: pendingRequests,
          registeredResidents: residentsCount,
          announcements: broadcastData.length
        });

        setBroadcasts(
          broadcastData.slice(0, 3).map(broadcast => ({
            message: broadcast.message,
            date: new Date(broadcast.createdAt).toISOString().split('T')[0],
            recipients: broadcast.phoneNumbers?.length || 0,
            category: broadcast.category || 'General'
          }))
        );

        setDocumentRequests(
          allRequests
            .filter(request => request.status === 'pending')
            .slice(0, 5)
            .map(request => ({
              name: request.fullName,
              document: request.documentType,
              status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
              date: new Date(request.createdAt).toISOString().split('T')[0]
            }))
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <MainTemplate headerName="Dashboard" cardHeader="Dashboard">
      <div className="dashboard-container">
        {loading ? (
          <div className="loading-state">Loading dashboard data...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <>
            <div className="stats-grid">
              <StatsCard icon={<FaEnvelope size={24} color="#fff" />} title="Total SMS Sent" value={stats.totalSMS} bgColor="#0038A8" />
              <StatsCard icon={<FaFileAlt size={24} color="#fff" />} title="Pending Requests" value={stats.pendingRequests} bgColor="#FCD116" />
              <StatsCard icon={<FaUsers size={24} color="#fff" />} title="Registered Residents" value={stats.registeredResidents} bgColor="#10b981" />
              <StatsCard icon={<FaBell size={24} color="#fff" />} title="Announcements" value={stats.announcements} bgColor="#8b5cf6" />
            </div>

            <div className="dashboard-content">
              <div className="broadcasts-section">
                <h3>Recent Broadcasts</h3>
                {broadcasts.length > 0 ? (
                  <div className="broadcasts-list">
                    {broadcasts.map((broadcast, index) => (
                      <div key={index} className="broadcast-item">
                        <p className="broadcast-message">{broadcast.message}</p>
                        <div className="broadcast-details">
                          <span className="broadcast-date">{broadcast.date}</span>
                          <span className="broadcast-recipients">
                            {broadcast.recipients} recipients • {broadcast.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data-message">No recent broadcasts found.</p>
                )}
              </div>

              <div className="requests-section">
                <h3>Recent Document Requests</h3>
                {documentRequests.length > 0 ? (
                  <table className="requests-table">
                    <thead>
                      <tr><th>NAME</th><th>DOCUMENT</th><th>STATUS</th><th>DATE</th></tr>
                    </thead>
                    <tbody>
                      {documentRequests.map((request, index) => (
                        <tr key={index}>
                          <td>{request.name}</td>
                          <td>{request.document}</td>
                          <td><span className={`status-badge ${request.status.toLowerCase()}`}>{request.status}</span></td>
                          <td>{request.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">No document requests found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainTemplate>
  );
}

function StatsCard({ icon, title, value, bgColor }) {
  return (
    <div className="stats-card">
      <div className="icon-container" style={{ backgroundColor: bgColor }}>{icon}</div>
      <div className="stats-info">
        <h4>{title}</h4>
        <p className="stats-value">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}