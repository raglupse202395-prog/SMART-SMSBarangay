import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton,
  Select, MenuItem, FormControl, InputLabel, Grid, Typography, Card, CardHeader, Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import service from "../../services/service";

export default function AddResidentModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    first_name: "", middle_name: "", last_name: "", suffix: "", birthdate: "", placeOfBirth: "",
    age: "", gender: "", marital_status: "", nationality: "Filipino",
    contact: { phone: "+63", email: "" }, // Starts with +63
    address: { house_number: "", street: "", barangay: "POBLACION 1", city: "CLARIN", province: "MISAMIS OCCIDENTAL", zip_code: "" },
    medical_info: { blood_type: "N/A", medical_conditions: [], disabilities: [], emergency_contact: { name: "", relationship: "", phone: "" } },
    employment: { occupation: "", employer: "", income_range: "" },
    education: { highest_education: "", field_of_study: "" },
    registration: { resident_type: "Permanent" },
    specialStatus: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  // Special handler to FORCE the phone number to start with +63
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // If the user tries to delete the +63, put it back
    if (!value.startsWith("+63")) {
      value = "+63" + value.replace(/^\+?6?3?/, ""); 
    }
    // Only allow numbers and the + sign
    if (/^\+?[0-9]*$/.test(value)) {
      handleNestedChange("contact", "phone", value);
    }
  };

  const handleMedicalInfoChange = (field, value) => {
    setFormData((prev) => ({ ...prev, medical_info: { ...prev.medical_info, [field]: value } }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      medical_info: { ...prev.medical_info, emergency_contact: { ...prev.medical_info.emergency_contact, [field]: value } },
    }));
  };

  const handleSubmit = async () => {
    // Final check before saving
    if (!formData.contact.phone.startsWith("+63") || formData.contact.phone.length < 13) {
      alert("❌ ERROR: Phone number must be complete and start with +63 (e.g., +639123456789).");
      return; 
    }

    try {
      const newResident = await service.registerResident(formData);
      setFormData({
        first_name: "", middle_name: "", last_name: "", suffix: "", birthdate: "", placeOfBirth: "",
        age: "", gender: "", marital_status: "", nationality: "Filipino",
        contact: { phone: "+63", email: "" },
        address: { house_number: "", street: "", barangay: "POBLACION 1", city: "CLARIN", province: "MISAMIS OCCIDENTAL", zip_code: "" },
        medical_info: { blood_type: "N/A", medical_conditions: [], disabilities: [], emergency_contact: { name: "", relationship: "", phone: "" } },
        employment: { occupation: "", employer: "", income_range: "" },
        education: { highest_education: "", field_of_study: "" },
        registration: { resident_type: "Permanent" },
        specialStatus: "",
      });
      onClose();
      window.location.reload();
      alert("Resident added successfully!");
    } catch (err) {
      console.error("Error adding resident:", err);
      alert("Failed to add resident. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Add New Resident</Typography>
          <IconButton aria-label="close" onClick={onClose}><CloseIcon /></IconButton>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        <Card variant="outlined" sx={{ my: 3 }}>
          <CardHeader title={<Typography variant="subtitle1">Basic Information</Typography>} />
          <Divider />
          <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} fullWidth /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} fullWidth /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Birthdate" name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} fullWidth /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth><InputLabel>Gender</InputLabel>
                <Select name="gender" value={formData.gender} onChange={handleChange} label="Gender" required>
                  <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth><InputLabel>Marital Status</InputLabel>
                <Select name="marital_status" value={formData.marital_status} onChange={handleChange} label="Marital Status" required>
                  <MenuItem value="Single">Single</MenuItem><MenuItem value="Married">Married</MenuItem><MenuItem value="Widowed">Widowed</MenuItem><MenuItem value="Divorced">Divorced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} fullWidth /></Grid>
          </Grid>
        </Card>

        <Card variant="outlined" sx={{ my: 3 }}>
          <CardHeader title={<Typography variant="subtitle1">Contact Information</Typography>} />
          <Divider />
          <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              {/* UPDATED PHONE FIELD */}
              <TextField 
                label="Phone Number" 
                value={formData.contact.phone} 
                onChange={handlePhoneChange} 
                fullWidth required 
                helperText="Format: +639XXXXXXXXX"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField label="Email" value={formData.contact.email} onChange={(e) => handleNestedChange("contact", "email", e.target.value)} fullWidth required /></Grid>
          </Grid>
        </Card>

        <Card variant="outlined" sx={{ my: 3 }}>
          <CardHeader title={<Typography variant="subtitle1">Address Information</Typography>} />
          <Divider />
          <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="House Number" value={formData.address.house_number} onChange={(e) => handleNestedChange("address", "house_number", e.target.value)} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Street" value={formData.address.street} onChange={(e) => handleNestedChange("address", "street", e.target.value)} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Barangay" value={formData.address.barangay} onChange={(e) => handleNestedChange("address", "barangay", e.target.value)} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="City" value={formData.address.city} onChange={(e) => handleNestedChange("address", "city", e.target.value)} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Province" value={formData.address.province} onChange={(e) => handleNestedChange("address", "province", e.target.value)} fullWidth required /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField label="Zip Code" value={formData.address.zip_code} onChange={(e) => handleNestedChange("address", "zip_code", e.target.value)} fullWidth /></Grid>
          </Grid>
        </Card>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save Resident</Button>
      </DialogActions>
    </Dialog>
  );
}