import { useContext, useEffect, useState } from 'react'
import MainTemplate from '../MainTemplate'
import AuthContext from '../../context/AuthContext'
import { jwtDecode } from 'jwt-decode'
import service from '../../services/service'
import SearchInput from '../SearchInput'
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { MenuItem, Select, InputLabel, FormControl } from '@mui/material'; // Added MUI imports for dropdown

export default function AdminAccounts() {
    const { user } = useContext(AuthContext)
    let role = null
    if (user) {
        try { role = jwtDecode(user).role; } catch (e) { role = null; }
    }
    if (role !== 'superadmin') return null

    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [editAdmin, setEditAdmin] = useState(null)
    
    // Added 'role' to the form state
    const [form, setForm] = useState({ username: '', password: '', fullname: '', phoneNumber: '', role: 'admin' })
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    const fetchAdmins = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await service.getAdminAccounts()
            setAdmins(data)
        } catch (e) {
            setError('Failed to fetch admin accounts')
        }
        setLoading(false)
    }
    useEffect(() => { fetchAdmins() }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await service.addAdminAccount(form)
            setShowAdd(false)
            setForm({ username: '', password: '', fullname: '', phoneNumber: '', role: 'admin' })
            fetchAdmins()
        } catch (e) { setError(e.message) }
    }

    const openEdit = (admin) => {
        setEditAdmin(admin)
        setForm({ username: admin.username, password: '', fullname: admin.fullname, phoneNumber: admin.phoneNumber, role: admin.role })
        setShowEdit(true)
    }

    const handleEdit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await service.updateAdminAccount(editAdmin._id, { fullname: form.fullname, phoneNumber: form.phoneNumber, password: form.password, role: form.role })
            setShowEdit(false)
            setEditAdmin(null)
            setForm({ username: '', password: '', fullname: '', phoneNumber: '', role: 'admin' })
            fetchAdmins()
        } catch (e) { setError(e.message) }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this admin?')) return
        setError('')
        try {
            await service.deleteAdminAccount(id)
            fetchAdmins()
        } catch (e) { setError(e.message) }
    }

    const filteredAdmins = search !== ''
        ? admins.filter(a =>
            (a.username && a.username.toLowerCase().includes(search.toLowerCase())) ||
            (a.fullname && a.fullname.toLowerCase().includes(search.toLowerCase()))
        )
        : admins

    return (
        <MainTemplate headerName={"Admin Accounts"} cardHeader={"Admin Accounts"}>
            <div className='main-section'>
                <div className='resident-options' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ flex: 1, maxWidth: 320 }}>
                        <SearchInput search={search} setSearch={setSearch} />
                    </div>
                    <Button onClick={() => { setShowAdd(true); setForm({ username: '', password: '', fullname: '', phoneNumber: '', role: 'admin' }) }}
                        variant="contained" startIcon={<AddIcon />} sx={{ ml: 2, bgcolor: '#0038A8' }}>
                        Add Admin
                    </Button>
                </div>
                {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
                {loading ? <div>Loading...</div> : (
                    <div className='residents'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Phone Number</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAdmins.map(a => (
                                    <tr key={a._id}>
                                        <td>{a.username}</td>
                                        <td>{a.fullname}</td>
                                        <td>{a.phoneNumber}</td>
                                        <td>{a.role}</td>
                                        <td>
                                            {a.role !== 'superadmin' && <>
                                                <IconButton aria-label='Edit-Icon' size="small" color="primary" onClick={() => openEdit(a)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton aria-label='Delete-Icon' size="small" color="error" onClick={() => handleDelete(a._id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {showAdd && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Add Admin</h3>
                        <form onSubmit={handleAdd}>
                            <input required placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                            <input required placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                            <input required placeholder="Full Name" value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
                            <input required placeholder="Phone Number" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} />
                            
                            {/* ADDED ROLE DROPDOWN */}
                            <FormControl fullWidth style={{ marginTop: 8 }}>
                                <InputLabel>Role</InputLabel>
                                <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} label="Role">
                                    <MenuItem value="admin">Admin (Staff)</MenuItem>
                                    <MenuItem value="secretary">Secretary</MenuItem>
                                    <MenuItem value="captain">Captain</MenuItem>
                                    <MenuItem value="treasurer">Treasurer</MenuItem>
                                    <MenuItem value="sk_chairman">SK Chairman</MenuItem>
                                    <MenuItem value="bhw">BHW</MenuItem>
                                </Select>
                            </FormControl>

                            <div style={{ marginTop: 16 }}>
                                <button type="submit">Add</button>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ marginLeft: 8 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showEdit && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Edit Admin</h3>
                        <form onSubmit={handleEdit}>
                            <input disabled value={form.username} />
                            <input placeholder="New Password (leave blank to keep)" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                            <input required placeholder="Full Name" value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
                            <input required placeholder="Phone Number" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} />
                            
                            {/* ADDED ROLE DROPDOWN */}
                            <FormControl fullWidth style={{ marginTop: 8 }}>
                                <InputLabel>Role</InputLabel>
                                <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} label="Role">
                                    <MenuItem value="admin">Admin (Staff)</MenuItem>
                                    <MenuItem value="secretary">Secretary</MenuItem>
                                    <MenuItem value="captain">Captain</MenuItem>
                                    <MenuItem value="treasurer">Treasurer</MenuItem>
                                    <MenuItem value="sk_chairman">SK Chairman</MenuItem>
                                    <MenuItem value="bhw">BHW</MenuItem>
                                </Select>
                            </FormControl>

                            <div style={{ marginTop: 16 }}>
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setShowEdit(false)} style={{ marginLeft: 8 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .modal-overlay { position: fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; z-index:1000; }
                .modal {
                    background: #fff;
                    padding: 32px 28px 24px 28px;
                    border-radius: 14px;
                    min-width: 340px;
                    max-width: 95vw;
                    box-shadow: 0 4px 32px #0003;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                }
                .modal h3 {
                    margin: 0 0 18px 0;
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #0038A8;
                    text-align: center;
                }
                .modal form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .modal input {
                    display: block;
                    width: 100%;
                    margin: 0;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 1rem;
                    background: #f9fafb;
                    transition: border 0.2s;
                }
                .modal input:focus {
                    border: 1.5px solid #0038A8;
                    outline: none;
                    background: #fff;
                }
                .modal form > div {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 10px;
                }
                .modal button[type="submit"] {
                    background: #0038A8;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 8px 20px;
                    font-weight: 500;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .modal button[type="submit"]:hover {
                    background: #FCD116;
                    color: #0038A8;
                }
                .modal button[type="button"] {
                    background: #e5e7eb;
                    color: #374151;
                    border: none;
                    border-radius: 5px;
                    padding: 8px 18px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .modal button[type="button"]:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </MainTemplate>
    )
}