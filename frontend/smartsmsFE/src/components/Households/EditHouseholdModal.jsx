import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Select, MenuItem, FormControl, InputLabel, Alert, DialogContentText, CircularProgress
} from '@mui/material';
import { Add, Delete, SwapHoriz } from '@mui/icons-material';
import service from '../../services/service';

const EditHouseholdModal = ({ open, onClose, onHouseholdUpdated, householdData }) => {
  const [household, setHousehold] = useState({
    region: '', province: '', cityMunicipality: '', barangay: '', householdAddress: ''
  });
  const [members, setMembers] = useState([]);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showChangeHeadDialog, setShowChangeHeadDialog] = useState(false);
  const [selectedNewHead, setSelectedNewHead] = useState(null);
  
  // Form state with default Marital Status
  const [memberFormData, setMemberFormData] = useState({
    first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', age: '', gender: '',
    marital_status: 'Single', nationality: 'Filipino', placeOfBirth: '', citizenship: 'Filipino',
    contact: { phone: '', email: '' },
    address: { house_number: '', street: '', barangay: 'POBLACION 1', city: 'CLARIN', province: 'MISAMIS OCCIDENTAL', zip_code: '' },
    medical_info: { blood_type: 'N/A', medical_conditions: [], disabilities: [], emergency_contact: { name: '', relationship: '', phone: '' } },
    employment: { occupation: '', employer: '', income_range: '' },
    education: { highest_education: '', field_of_study: '' },
    registration: { resident_type: 'Permanent' },
    specialStatus: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removeAction, setRemoveAction] = useState('unassign');

  useEffect(() => {
    if (open && householdData) {
      setHousehold({
        region: householdData.household.region || '',
        province: householdData.household.province || '',
        cityMunicipality: householdData.household.cityMunicipality || '',
        barangay: householdData.household.barangay || '',
        householdAddress: householdData.household.householdAddress || ''
      });
      setMembers(householdData.members || []);
      setError('');
      setShowAddMemberForm(false);
    }
  }, [open, householdData]);

  const handleHouseholdDataChange = (field, value) => {
    setHousehold(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setMemberFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setMemberFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleBirthdateChange = (value) => {
    setMemberFormData(prev => ({ ...prev, birthdate: value, age: value ? calculateAge(value) : '' }));
  };

  // FIXED: Added error display and auto-fill for address
  const handleAddMember = async () => {
    // 1. Validate required fields
    if (!memberFormData.first_name || !memberFormData.last_name || !memberFormData.birthdate || 
        !memberFormData.gender || !memberFormData.marital_status || !memberFormData.contact.phone) {
      setError('Please fill in all required fields: First Name, Last Name, Birthdate, Gender, Marital Status, and Phone.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 2. Auto-fill address based on the household's address if left blank
      const memberPayload = {
        ...memberFormData,
        contact: { 
          phone: memberFormData.contact.phone || 'N/A', 
          email: memberFormData.contact.email || 'N/A' 
        },
        address: {
          house_number: memberFormData.address.house_number || 'N/A',
          street: memberFormData.address.street || household.householdAddress, // Fallback to household address
          barangay: memberFormData.address.barangay || household.barangay,
          city: memberFormData.address.city || household.cityMunicipality,
          province: memberFormData.address.province || household.province
        }
      };

      // 3. Save to DB
      await service.addHouseholdMember(householdData.household._id, memberPayload, false);
      
      // 4. Refresh the members list
      const response = await service.getHousehold(householdData.household._id);
      setMembers(response.members);
      
      // 5. Reset form and close it
      setMemberFormData({
        first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', age: '', gender: '',
        marital_status: 'Single', nationality: 'Filipino', placeOfBirth: '', citizenship: 'Filipino',
        contact: { phone: '', email: '' },
        address: { house_number: '', street: '', barangay: 'POBLACION 1', city: 'CLARIN', province: 'MISAMIS OCCIDENTAL', zip_code: '' },
        medical_info: { blood_type: 'N/A', medical_conditions: [], disabilities: [], emergency_contact: { name: '', relationship: '', phone: '' } },
        employment: { occupation: '', employer: '', income_range: '' },
        education: { highest_education: '', field_of_study: '' },
        registration: { resident_type: 'Permanent' },
        specialStatus: ''
      });
      setShowAddMemberForm(false);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding member. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (member) => {
    setMemberToRemove(member);
    setRemoveAction('unassign');
    setShowRemoveDialog(true);
  };

  const confirmRemoveMember = async () => {
    try {
      setLoading(true);
      await service.removeHouseholdMember(householdData.household._id, memberToRemove._id, removeAction);
      const response = await service.getHousehold(householdData.household._id);
      setMembers(response.members);
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Error removing member');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeHead = (member) => {
    setSelectedNewHead(member);
    setShowChangeHeadDialog(true);
  };

  const confirmChangeHead = async () => {
    try {
      setLoading(true);
      await service.changeHouseholdHead(householdData.household._id, selectedNewHead._id);
      const response = await service.getHousehold(householdData.household._id);
      setMembers(response.members);
      setShowChangeHeadDialog(false);
      setSelectedNewHead(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error changing household head');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      if (!household.region || !household.province || !household.cityMunicipality ||
          !household.barangay || !household.householdAddress) {
        setError('Please fill in all household information.');
        return;
      }
      await service.updateHousehold(householdData.household._id, household);
      onHouseholdUpdated();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error updating household');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setShowAddMemberForm(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Household</DialogTitle>
        <DialogContent dividers>
          {/* ERROR DISPLAY */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="h6" gutterBottom sx={{ mt: 1, color: '#0038A8' }}>Household Information</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Region *" value={household.region} onChange={(e) => handleHouseholdDataChange('region', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Province *" value={household.province} onChange={(e) => handleHouseholdDataChange('province', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="City/Municipality *" value={household.cityMunicipality} onChange={(e) => handleHouseholdDataChange('cityMunicipality', e.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Barangay *" value={household.barangay} onChange={(e) => handleHouseholdDataChange('barangay', e.target.value)} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Household Address *" value={household.householdAddress} onChange={(e) => handleHouseholdDataChange('householdAddress', e.target.value)} /></Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Household Members ({members.length}/18)</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setShowAddMemberForm(true)} disabled={members.length >= 18}>
              Add Member
            </Button>
          </Box>

          {members.length === 0 ? (
            <Alert severity="warning">No members in this household.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 2, border: '1px solid #ddd' }}>
              <Table size="small">
                <TableHead sx={{ background: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Age</b></TableCell>
                    <TableCell><b>Gender</b></TableCell>
                    <TableCell><b>Phone</b></TableCell>
                    <TableCell><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold' }}>
                            {`${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim()}
                          </span>
                          {member.isHouseholdHead && (
                            <Chip label="HOUSEHOLD HEAD" size="small" color="success" sx={{ fontSize: '0.65rem', height: '20px', width: 'fit-content' }} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{member.age}</TableCell>
                      <TableCell>{member.gender}</TableCell>
                      <TableCell>{member.contact?.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {!member.isHouseholdHead && (
                          <IconButton size="small" onClick={() => handleChangeHead(member)} color="primary" title="Make Household Head">
                            <SwapHoriz />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleRemoveMember(member)} color="error" title="Remove Member">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {showAddMemberForm && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, background: '#f9fafb' }}>
              <Typography variant="h6" gutterBottom>Add New Family Member</Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="First Name *" value={memberFormData.first_name} onChange={(e) => handleMemberFormChange('first_name', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Middle Name" value={memberFormData.middle_name} onChange={(e) => handleMemberFormChange('middle_name', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Last Name *" value={memberFormData.last_name} onChange={(e) => handleMemberFormChange('last_name', e.target.value)} /></Grid>
                
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Birthdate *" type="date" value={memberFormData.birthdate} onChange={(e) => handleBirthdateChange(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid size={{ xs: 12, md: 2 }}><TextField fullWidth label="Age" value={memberFormData.age} InputProps={{ readOnly: true }} /></Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth><InputLabel>Gender *</InputLabel>
                    <Select value={memberFormData.gender} onChange={(e) => handleMemberFormChange('gender', e.target.value)} label="Gender *">
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth><InputLabel>Marital Status *</InputLabel>
                    <Select value={memberFormData.marital_status} onChange={(e) => handleMemberFormChange('marital_status', e.target.value)} label="Marital Status *">
                      <MenuItem value="Single">Single</MenuItem>
                      <MenuItem value="Married">Married</MenuItem>
                      <MenuItem value="Widowed">Widowed</MenuItem>
                      <MenuItem value="Divorced">Divorced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Phone *" value={memberFormData.contact.phone} onChange={(e) => handleMemberFormChange('contact.phone', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Email (Optional)" type="email" value={memberFormData.contact.email} onChange={(e) => handleMemberFormChange('contact.email', e.target.value)} /></Grid>
                
                <Grid size={{ xs: 12 }}><Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Address Information (Leave blank to use household address)</Typography></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="House Number" value={memberFormData.address.house_number} onChange={(e) => handleMemberFormChange('address.house_number', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 8 }}><TextField fullWidth label="Street" value={memberFormData.address.street} onChange={(e) => handleMemberFormChange('address.street', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Barangay" value={memberFormData.address.barangay} onChange={(e) => handleMemberFormChange('address.barangay', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="City" value={memberFormData.address.city} onChange={(e) => handleMemberFormChange('address.city', e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Province" value={memberFormData.address.province} onChange={(e) => handleMemberFormChange('address.province', e.target.value)} /></Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
                <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Add />} onClick={handleAddMember} disabled={loading}>
                  {loading ? 'Saving to Database...' : 'Save Member'}
                </Button>
                <Button variant="outlined" onClick={() => setShowAddMemberForm(false)}>Cancel</Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={handleClose} color="inherit">CANCEL</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ background: '#0038A8' }}>
            {loading ? 'Updating...' : 'UPDATE HOUSEHOLD'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* REMOVE MEMBER DIALOG */}
      <Dialog open={showRemoveDialog} onClose={() => { setShowRemoveDialog(false); setMemberToRemove(null); }}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            What would you like to do with {memberToRemove?.first_name} {memberToRemove?.last_name}?
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select value={removeAction} onChange={(e) => setRemoveAction(e.target.value)} label="Action">
              <MenuItem value="unassign">Unassign from household (keep resident record)</MenuItem>
              <MenuItem value="delete">Delete resident entirely</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowRemoveDialog(false); setMemberToRemove(null); }}>Cancel</Button>
          <Button onClick={confirmRemoveMember} color="error" disabled={loading}>
            {loading ? 'Processing...' : (removeAction === 'delete' ? 'Delete' : 'Unassign')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CHANGE HEAD DIALOG */}
      <Dialog open={showChangeHeadDialog} onClose={() => setShowChangeHeadDialog(false)}>
        <DialogTitle>Change Household Head</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to make {selectedNewHead?.first_name} {selectedNewHead?.last_name} the new household head?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangeHeadDialog(false)}>Cancel</Button>
          <Button onClick={confirmChangeHead} color="primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Head'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditHouseholdModal;