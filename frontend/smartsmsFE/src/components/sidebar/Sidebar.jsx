import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';
import { 
    FaHome, FaBullhorn, FaHistory, FaFileAlt, 
    FaClipboardList, FaUsers, FaHome as FaHouse, 
    FaUserShield, FaListAlt, FaCog, FaSignOutAlt 
} from 'react-icons/fa';
import { MdFamilyRestroom } from "react-icons/md";
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../../context/AuthContext';
import { useContext } from 'react';

export default function CustomSidebar({ closeSidebar }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useContext(AuthContext);

    let decoded = null;
    try {
        if (user) decoded = jwtDecode(user);
    } catch (e) {
        decoded = null;
    }

    const handleNavigation = (path) => {
        navigate(path);
        if (closeSidebar) closeSidebar(); // Closes sidebar on mobile
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname.includes(path) ? 'menu-item active' : 'menu-item';

    return (
        <div className="sidebar-container">
            <div className="sidebar-header cool-header">
                <img src="/clarin-seal.png" alt="Logo" className="sidebar-logo" />
                <div className="sidebar-title">
                    <span className="main-title">SMART SMS</span>
                    <span className="sub-title">POBLACION 1</span>
                </div>
            </div>

            <div className="Menu">
                <div className={isActive('/admin/dashboard')} onClick={() => handleNavigation('/admin/dashboard')}>
                    <FaHome /> Dashboard
                </div>
                <div className={isActive('/admin/announcements')} onClick={() => handleNavigation('/admin/announcements')}>
                    <FaBullhorn /> Broadcast
                </div>
                <div className={isActive('/admin/broadcast-history')} onClick={() => handleNavigation('/admin/broadcast-history')}>
                    <FaHistory /> Broadcast History
                </div>
                <div className={isActive('/admin/document-request')} onClick={() => handleNavigation('/admin/document-request')}>
                    <FaFileAlt /> Document Request
                </div>
                <div className={isActive('/admin/request-history')} onClick={() => handleNavigation('/admin/request-history')}>
                    <FaClipboardList /> Request History
                </div>
                <div className={isActive('/admin/residents')} onClick={() => handleNavigation('/admin/residents')}>
                    <FaUsers /> Residents
                </div>
                <div className={isActive('/admin/households')} onClick={() => handleNavigation('/admin/households')}>
                    <MdFamilyRestroom /> Households
                </div>

                {/* Only show Admin specific links to Superadmin */}
                {decoded?.role === 'superadmin' && (
                    <>
                        <div className={isActive('/admin/admin-accounts')} onClick={() => handleNavigation('/admin/admin-accounts')}>
                            <FaUserShield /> Admin Accounts
                        </div>
                        <div className={isActive('/admin/admin-history')} onClick={() => handleNavigation('/admin/admin-history')}>
                            <FaListAlt /> Admin History
                        </div>
                    </>
                )}

                <div className={isActive('/admin/settings')} onClick={() => handleNavigation('/admin/settings')}>
                    <FaCog /> Settings
                </div>
            </div>

            <div className="sidebar-footer cool-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {decoded?.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div className="user-name">{decoded?.fullname || 'Admin'}</div>
                        <div className="user-role">Barangay Role: <b>{decoded?.role || 'Admin'}</b></div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt style={{ marginRight: '8px' }} /> Logout
                </button>
                <div className="copyright">
                    © Made By Group E.C.T 
                </div>
            </div>
        </div>
    );
}