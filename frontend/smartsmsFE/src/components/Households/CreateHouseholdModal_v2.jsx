import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress
} from '@mui/material';
import { Add, CheckCircle } from '@mui/icons-material';
import service from '../../services/service';

const CreateHouseholdModal = ({ open, onClose, onHouseholdCreated }) => {
  const [step, setStep] = useState(1);
  const [createdHouseholdId, setCreatedHouseholdId] = useState(null);
  const [createdHouseholdDisplayId, setCreatedHouseholdDisplayId] = useState(null);
  
  const [householdData, setHouseholdData] = useState({
    region: 'Region 10', 
    province: 'Misamis Occidental', 
    cityMunicipality: 'Clarin', 
    barangay: 'Poblacion 1', 
    householdAddress: ''
  });
  
  const [members, setMembers] = useState([]);
  
  const [memberFormData, setMemberFormData] = useState({
    first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', age: '', gender: '',
    marital_status: 'Single', nationality: 'Filipino',
    contact: { phone: '', email: '' }
  });

  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- STEP 1: CREATE HOUSEHOLD & FIRST MEMBER ---
  const handleCreateHousehold = async () => {
    if (!householdData.householdAddress) {
      setError('Please fill in the Household Address.');
      return;
    }
    if (!memberFormData.first_name || !memberFormData.last_name || !memberFormData.birthdate || !memberFormData.gender) {
      setError('Please fill in the Household Head\'s details (First Name, Last Name, Birthdate, Gender).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const firstMemberPayload = {
        ...memberFormData,
        contact: { 
          phone: memberFormData.contact.phone || 'N/A', 
          email: memberFormData.contact.email || 'N/A' 
        },
        address: {
          house_number: 'N/A',
          street: householdData.householdAddress, 
          barangay: householdData.barangay,
          city: householdData.cityMunicipality,
          province: householdData.province
        }
      };

      const response = await service.createHousehold(householdData, [firstMemberPayload]);
      
      setCreatedHouseholdId(response._id);
      setCreatedHouseholdDisplayId(response.householdId);
      setMembers([{ ...firstMemberPayload, _id: response.headMemberId, isHouseholdHead: true }]);
      
      setStep(2);
      setSuccessMsg(`Household ${response.householdId} created! You can now add more family members.`);
      
      resetMemberForm();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error creating household');
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: ADD MORE FAMILY MEMBERS ---
  const handleAddResident = async () => {
    if (!memberFormData.first_name || !memberFormData.last_name || !memberFormData.birthdate || !memberFormData.gender) {
      setError('Please fill in First Name, Last Name, Birthdate, and Gender.');
      return;
    }

    try {
      setAddingMember(true);
      setError('');
      setSuccessMsg('');

      const memberPayload = {
        ...memberFormData,
        contact: { 
          phone: memberFormData.contact.phone || 'N/A', 
          email: memberFormData.contact.email || 'N/A' 
        },
        address: {
          house_number: 'N/A',
          street: householdData.householdAddress,
          barangay: householdData.barangay,
          city: householdData.cityMunicipality,
          province: householdData.province
        }
      };

      const savedResident = await service.addHouseholdMember(createdHouseholdId, memberPayload, false);
      
      setMembers(prev => [...prev, savedResident]);
      
      // UPDATED SUCCESS MESSAGE
      setSuccessMsg(`✅ ${savedResident.first_name} ${savedResident.last_name} has been successfully saved to the Residents database!`);
      
      resetMemberForm();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error adding family member');
    } finally {
      setAddingMember(false);
    }
  };

  const resetMemberForm = () => {
    setMemberFormData({
      first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', age: '', gender: '',
      marital_status: 'Single', nationality: 'Filipino',
      contact: { phone: '', email: '' }
    });
  };

  const handleHouseholdDataChange = (field, value) => setHouseholdData(prev => ({ ...prev, [field]: value }));

  const handleMemberFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setMemberFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setMemberFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date(); const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleBirthdateChange = (value) => {
    setMemberFormData(prev => ({ ...prev, birthdate: value, age: value ? calculateAge(value) : '' }));
  };

  const handleFinish = () => {
    onHouseholdCreated();
    handleClose();
  };

  const handleClose = () => {
    setHouseholdData({ region: 'Region 10', province: 'Misamis Occidental', cityMunicipality: 'Clarin', barangay: 'Poblacion 1', householdAddress: '' });
    setMembers([]);
    setError('');
    setSuccessMsg('');
    setStep(1);
    setCreatedHouseholdId(null);
    setCreatedHouseholdDisplayId(null);
    resetMemberForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {step === 1 ? 'Create New Household' : `Household ${createdHouseholdDisplayId} - Add Family Members`}
        </span>
        {step === 2 && <Chip label="Database Connected" color="success" size="small" />}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {step === 1 ? (
          // STEP 1: CREATE HOUSEHOLD
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#0038A8' }}>1. Household Information</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Region *" value={householdData.region} onChange={(e) => handleHouseholdDataChange('region', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Province *" value={householdData.province} onChange={(e) => handleHouseholdDataChange('province', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="City/Municipality *" value={householdData.cityMunicipality} onChange={(e) => handleHouseholdDataChange('cityMunicipality', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Barangay *" value={householdData.barangay} onChange={(e) => handleHouseholdDataChange('barangay', e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Household Address (e.g. Purok 4, Esperanza St) *" value={householdData.householdAddress} onChange={(e) => handleHouseholdDataChange('householdAddress', e.target.value)} /></Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ color: '#0038A8' }}>2. Household Head</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="First Name *" value={memberFormData.first_name} onChange={(e) => handleMemberFormChange('first_name', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Middle Name" value={memberFormData.middle_name} onChange={(e) => handleMemberFormChange('middle_name', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Last Name *" value={memberFormData.last_name} onChange={(e) => handleMemberFormChange('last_name', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Suffix" value={memberFormData.suffix} onChange={(e) => handleMemberFormChange('suffix', e.target.value)} /></Grid>
              
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
                <FormControl fullWidth><InputLabel>Marital Status</InputLabel>
                  <Select value={memberFormData.marital_status} onChange={(e) => handleMemberFormChange('marital_status', e.target.value)} label="Marital Status">
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Widowed">Widowed</MenuItem>
                    <MenuItem value="Divorced">Divorced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Phone (Optional)" value={memberFormData.contact.phone} onChange={(e) => handleMemberFormChange('contact.phone', e.target.value)} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Email (Optional)" value={memberFormData.contact.email} onChange={(e) => handleMemberFormChange('contact.email', e.target.value)} /></Grid>
            </Grid>
          </Box>
        ) : (
          // STEP 2: ADD FAMILY MEMBERS DIRECTLY TO DB
          <Grid container spacing={3}>
            {/* LEFT SIDE: FORM */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#0038A8' }}>Add Family Member</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="First Name *" value={memberFormData.first_name} onChange={(e) => handleMemberFormChange('first_name', e.target.value)} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="Middle Name" value={memberFormData.middle_name} onChange={(e) => handleMemberFormChange('middle_name', e.target.value)} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="Last Name *" value={memberFormData.last_name} onChange={(e) => handleMemberFormChange('last_name', e.target.value)} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="Birthdate *" type="date" value={memberFormData.birthdate} onChange={(e) => handleBirthdateChange(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth size="small"><InputLabel>Gender *</InputLabel>
                      <Select value={memberFormData.gender} onChange={(e) => handleMemberFormChange('gender', e.target.value)} label="Gender *">
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth size="small" label="Phone (Optional)" value={memberFormData.contact.phone} onChange={(e) => handleMemberFormChange('contact.phone', e.target.value)} /></Grid>
                </Grid>
                
                <Button 
                  fullWidth
                  variant="contained" 
                  color="success" 
                  startIcon={addingMember ? <CircularProgress size={20} color="inherit"/> : <Add />} 
                  onClick={handleAddResident}
                  disabled={addingMember}
                  sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
                >
                  {addingMember ? 'Saving to Database...' : 'Save Family Member'}
                </Button>
              </Box>
            </Grid>

            {/* RIGHT SIDE: TABLE */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#0038A8' }}>Household Members ({members.length}/18)</Typography>
              <TableContainer component={Paper} sx={{ border: '1px solid #ddd', maxHeight: '400px' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Name</b></TableCell>
                      <TableCell><b>Age</b></TableCell>
                      <TableCell><b>Gender</b></TableCell>
                      <TableCell><b>Role</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member, index) => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div style={{ fontWeight: 'bold' }}>{`${member.first_name} ${member.last_name}`}</div>
                        </TableCell>
                        <TableCell>{member.age}</TableCell>
                        <TableCell>{member.gender}</TableCell>
                        <TableCell>
                          {index === 0 ? <Chip label="HEAD" size="small" color="success" /> : <Chip label="MEMBER" size="small" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        
        {step === 1 ? (
          <Button variant="contained" onClick={handleCreateHousehold} disabled={loading} sx={{ background: '#0038A8' }}>
            {loading ? 'Creating...' : 'Save Household & Proceed'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleFinish} color="primary" startIcon={<CheckCircle />}>
            Finish & View Households
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateHouseholdModal;