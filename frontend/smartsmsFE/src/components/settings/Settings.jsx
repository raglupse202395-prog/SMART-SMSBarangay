import { useState, useContext, useEffect } from 'react';
import MainTemplate from '../MainTemplate';
import AuthContext from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import service from '../../services/service';
import { 
    FaUser, FaLock, FaSave, FaUsers, FaPlus, 
    FaTrash, FaEdit, FaTimes, FaInfoCircle, FaCode
} from 'react-icons/fa';

export default function Settings() {
    const { user } = useContext(AuthContext);
    let decoded = null;
    try {
        if (user) decoded = jwtDecode(user);
    } catch (e) {
        decoded = null;
    }

    // --- STATE FOR MY PROFILE ---
    const [profileData, setProfileData] = useState({
        fullname: decoded?.fullname || '',
        phoneNumber: decoded?.phoneNumber || '',
        email: decoded?.email || '',
        newPassword: '',
        confirmPassword: ''
    });
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // --- STATE FOR STAFF MANAGEMENT ---
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    
    const [staffForm, setStaffForm] = useState({
        username: '', password: '', fullname: '', phoneNumber: '', role: 'admin'
    });
    const [staffError, setStaffError] = useState('');

    useEffect(() => {
        fetchStaff();
    }, []);

    // --- PROFILE FUNCTIONS ---
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileMessage('');
        setProfileError('');

        if (profileData.newPassword || profileData.confirmPassword) {
            if (profileData.newPassword !== profileData.confirmPassword) {
                setProfileError('New passwords do not match.');
                return;
            }
        }

        setIsUpdatingProfile(true);
        try {
            const payload = {
                fullname: profileData.fullname,
                phoneNumber: profileData.phoneNumber,
                email: profileData.email,
            };
            if (profileData.newPassword) payload.password = profileData.newPassword;

            await service.updateAdminAccount(decoded.userId, payload);
            setProfileMessage('Your profile has been updated successfully!');
            setProfileData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (err) {
            setProfileError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // --- STAFF FUNCTIONS ---
    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const data = await service.getAdminAccounts();
            setStaffList(data);
        } catch (err) {
            console.error("Failed to load staff", err);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleStaffFormChange = (e) => {
        setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
    };

    const openAddStaff = () => {
        setEditingStaff(null);
        setStaffForm({ username: '', password: '', fullname: '', phoneNumber: '', role: 'admin' });
        setStaffError('');
        setShowStaffModal(true);
    };

    const openEditStaff = (staff) => {
        setEditingStaff(staff);
        setStaffForm({ 
            username: staff.username, 
            password: '', 
            fullname: staff.fullname, 
            phoneNumber: staff.phoneNumber, 
            role: staff.role 
        });
        setStaffError('');
        setShowStaffModal(true);
    };

    const handleSaveStaff = async (e) => {
        e.preventDefault();
        setStaffError('');
        try {
            if (editingStaff) {
                const payload = { fullname: staffForm.fullname, phoneNumber: staffForm.phoneNumber, role: staffForm.role };
                if (staffForm.password) payload.password = staffForm.password;
                await service.updateAdminAccount(editingStaff._id, payload);
            } else {
                await service.addAdminAccount(staffForm);
            }
            setShowStaffModal(false);
            fetchStaff();
        } catch (err) {
            setStaffError(err.response?.data?.error || 'Failed to save staff.');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff account?')) return;
        try {
            await service.deleteAdminAccount(id);
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete staff');
        }
    };

    // Reusable style objects
    const inputStyle = { width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' };
    const cardStyle = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '25px' };

    return (
        <MainTemplate headerName="Settings" cardHeader="Account & System Settings">
            <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* 1. MY PROFILE SECTION */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#0038A8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaUser /> My Profile
                    </h3>

                    {profileMessage && <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{profileMessage}</div>}
                    {profileError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{profileError}</div>}

                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" name="fullname" value={profileData.fullname} onChange={handleProfileChange} required style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone Number</label>
                                <input type="text" name="phoneNumber" value={profileData.phoneNumber} onChange={handleProfileChange} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Email Address</label>
                            <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} style={inputStyle} />
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
                        <h4 style={{ margin: '0', color: '#0038A8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}><FaLock /> Change Password</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <input type="password" name="newPassword" value={profileData.newPassword} onChange={handleProfileChange} placeholder="Leave blank to keep current" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <input type="password" name="confirmPassword" value={profileData.confirmPassword} onChange={handleProfileChange} placeholder="Confirm new password" style={inputStyle} />
                            </div>
                        </div>

                        <button type="submit" disabled={isUpdatingProfile} style={{ alignSelf: 'flex-start', background: '#0038A8', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaSave /> {isUpdatingProfile ? 'Saving...' : 'Save My Profile'}
                        </button>
                    </form>
                </div>

                {/* 2. ADMIN ACCOUNTS SECTION */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#0038A8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaUsers /> Admin Accounts
                        </h3>
                        <button onClick={openAddStaff} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPlus /> Add Admin
                        </button>
                    </div>

                    {staffLoading ? <p>Loading accounts...</p> : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px', color: '#0038A8', fontSize: '13px' }}>NAME / ROLE</th>
                                        <th style={{ padding: '12px', color: '#0038A8', fontSize: '13px' }}>PHONE</th>
                                        <th style={{ padding: '12px', color: '#0038A8', fontSize: '13px' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map(staff => (
                                        <tr key={staff._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{staff.fullname}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    @{staff.username} • <span style={{ color: '#0038A8', fontWeight: 'bold', textTransform: 'capitalize' }}>{staff.role}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>{staff.phoneNumber || 'N/A'}</td>
                                            <td style={{ padding: '12px' }}>
                                                <button onClick={() => openEditStaff(staff)} style={{ background: 'transparent', border: 'none', color: '#FCD116', cursor: 'pointer', marginRight: '15px', fontSize: '16px' }} title="Edit">
                                                    <FaEdit />
                                                </button>
                                                {staff.role !== 'superadmin' && (
                                                    <button onClick={() => handleDeleteStaff(staff._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }} title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {staffList.length === 0 && (
                                        <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No staff accounts found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 3. SYSTEM & LICENSE INFO */}
                <div style={{ ...cardStyle, background: '#f8fafc' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0038A8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaInfoCircle /> System Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#374151' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <span style={{ fontWeight: '600' }}>System Name:</span>
                            <span style={{ textAlign: 'right' }}>SmartSMS Barangay Management System</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <span style={{ fontWeight: '600' }}>Version:</span>
                            <span>v1.0.0</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <span style={{ fontWeight: '600' }}>Developed By:</span>
                            <span>Group E.C.T</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <span style={{ fontWeight: '600' }}>License:</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaCode /> MIT Open Source License</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* STAFF MODAL (Add/Edit) */}
            {showStaffModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '8px', padding: '30px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#0038A8' }}>{editingStaff ? 'Edit Account' : 'Add New Admin/Staff'}</h3>
                            <button onClick={() => setShowStaffModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}><FaTimes /></button>
                        </div>

                        {staffError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{staffError}</div>}

                        <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" name="fullname" value={staffForm.fullname} onChange={handleStaffFormChange} required style={inputStyle} />
                            </div>
                            
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input type="text" name="username" value={staffForm.username} onChange={handleStaffFormChange} required disabled={!!editingStaff} style={{ ...inputStyle, background: editingStaff ? '#f3f4f6' : 'white' }} />
                            </div>

                            <div>
                                <label style={labelStyle}>{editingStaff ? 'New Password (Leave blank to keep)' : 'Password'}</label>
                                <input type="password" name="password" value={staffForm.password} onChange={handleStaffFormChange} required={!editingStaff} style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Phone Number</label>
                                <input type="text" name="phoneNumber" value={staffForm.phoneNumber} onChange={handleStaffFormChange} required style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Role</label>
                                <select name="role" value={staffForm.role} onChange={handleStaffFormChange} style={inputStyle}>
                                    <option value="admin">Admin (Staff)</option>
                                    <option value="secretary">Secretary</option>
                                    <option value="captain">Captain</option>
                                    <option value="treasurer">Treasurer</option>
                                    <option value="sk_chairman">SK Chairman</option>
                                    <option value="bhw">BHW</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowStaffModal(false)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#0038A8', color: 'white', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainTemplate>
    );
}