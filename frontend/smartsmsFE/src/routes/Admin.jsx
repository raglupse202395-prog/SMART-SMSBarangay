import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

import CustomSidebar from "../components/sidebar/Sidebar";
import Broadcast from '../components/Broadcast/Broadcast'
import Dashboard from '../components/Dashboard/Dashboard';
import BroadcastHistory from '../components/BroadcastHistory/BroadcastHistory';
import DocumentRequest from '../components/DocumentRequest/DocumentRequest';
import RequestHistory from '../components/RequestHistory/RequestHistory';
import Residents from '../components/Residents/Residents';
import AdminAccounts from '../components/AdminAccounts/AdminAccounts';
import AdminHistory from '../components/AdminAccounts/AdminHistory';
import Households from '../components/Households/Households';
import Settings from '../components/settings/Settings';

function AdminDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: '#eee',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Mobile Top Bar */}
            <div className="mobile-topbar">
                <IconButton onClick={toggleSidebar} style={{ color: '#0038A8' }}>
                    <MenuIcon />
                </IconButton>
                <span style={{ fontWeight: 'bold', color: '#0038A8' }}>SmartSMS Admin</span>
            </div>

            {/* Sidebar */}
            <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
                <CustomSidebar closeSidebar={() => setIsSidebarOpen(false)} />
            </div>

            {/* Dark overlay for mobile */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: '1', background: '#eee', overflowX: 'hidden' }} className="main-content-area">
                <Routes>
                    <Route path="/" element={<Navigate to="dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="announcements" element={<Broadcast />} />
                    <Route path="broadcast-history" element={<BroadcastHistory />} />
                    <Route path="document-request" element={<DocumentRequest />} />
                    <Route path="request-history" element={<RequestHistory />} />
                    <Route path="residents" element={<Residents />} />
                    <Route path="households" element={<Households />} />
                    <Route path="admin-accounts" element={<AdminAccounts />} />
                    <Route path="admin-history" element={<AdminHistory />} />
                    <Route path="settings" element={<Settings />} />
                </Routes>
            </div>

            <style>{`
                .mobile-topbar { display: none; }
                .sidebar-wrapper { display: flex; height: 100vh; z-index: 1000; }
                .main-content-area { padding-top: 0; height: 100vh; overflow-y: auto; }

                @media (max-width: 1024px) {
                    .mobile-topbar {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        position: fixed;
                        top: 0; left: 0; right: 0;
                        height: 60px;
                        background: white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        z-index: 1001;
                        padding: 0 15px;
                    }
                    .sidebar-wrapper {
                        position: fixed;
                        top: 0;
                        left: -300px;
                        height: 100vh;
                        transition: left 0.3s ease;
                    }
                    .sidebar-wrapper.open {
                        left: 0;
                    }
                    .sidebar-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 999;
                    }
                    .main-content-area {
                        padding-top: 60px;
                    }
                }
            `}</style>
        </div>
    )
}

export default AdminDashboard;