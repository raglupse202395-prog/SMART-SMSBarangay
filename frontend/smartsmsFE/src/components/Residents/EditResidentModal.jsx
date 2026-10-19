import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton,
  Select, MenuItem, FormControl, InputLabel, Grid, Typography, Card, CardHeader, Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import service from "../../services/service";

const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().split("T")[0];
};

export default function EditResidentModal({ open, onClose, resident }) {
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (resident) {
      // Auto-fix old numbers that start with 09 when opening the modal
      let existingPhone = resident.contact?.phone || "";
      if (existingPhone.startsWith("09")) {
        existingPhone = "+63" + existingPhone.substring(1);
      } else if (!existingPhone.startsWith("+63")) {
        existingPhone = "+63" + existingPhone;
      }

      setFormData({
        first_name: resident.first_name || "",
        middle_name: resident.middle_name || "",
        last_name: resident.last_name || "",
        suffix: resident.suffix || "",
        birthdate: formatDateForInput(resident.birthdate),
        placeOfBirth: resident.placeOfBirth || "",
        age: resident.age || "",
        gender: resident.gender || "",
        marital_status: resident.marital_status || "",
        nationality: resident.nationality || "Filipino",
        contact: { phone: existingPhone, email: resident.contact?.email || "" },
        address: {
          house_number: resident.address?.house_number || "",
          street: resident.address?.street || "",
          barangay: resident.address?.barangay || "POBLACION 1",
          city: resident.address?.city || "CLARIN",
          province: resident.address?.province || "MISAMIS OCCIDENTAL",
          zip_code: resident.address?.zip_code || "",
        },
        medical_info: {
          blood_type: resident.medical_info?.blood_type || "N/A",
          medical_conditions: resident.medical_info?.medical_conditions || [],
          disabilities: resident.medical_info?.disabilities || [],
          emergency_contact: {
            name: resident.medical_info?.emergency_contact?.name || "",
            relationship: resident.medical_info?.emergency_contact?.relationship || "",
            phone: resident.medical_info?.emergency_contact?.phone || "",
          },
        },
        employment: {
          occupation: resident.employment?.occupation || "",
          employer: resident.employment?.employer || "",
          income_range: resident.employment?.income_range || "",
        },
        education: {
          highest_education: resident.education?.highest_education || "",
          field_of_study: resident.education?.field_of_study || "",
        },
        registration: { resident_type: resident.registration?.resident_type || "Permanent" },
        specialStatus: resident.specialStatus || "",
      });
    }
  }, [resident]);

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
    if (!value.startsWith("+63")) {
      value = "+63" + value.replace(/^\+?6?3?/, ""); 
    }
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
    if (!formData.contact.phone.startsWith("+63") || formData.contact.phone.length < 13) {
      alert("❌ ERROR: Phone number must be complete and start with +63 (e.g., +639123456789).");
      return; 
    }

    try {
      const submitData = { ...formData, birthdate: new Date(formData.birthdate).toISOString() };
      await service.updateResident(resident._id, submitData);
      onClose();
      alert("Resident updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error updating resident:", err);
      alert("Failed to update resident. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Edit Resident</Typography>
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
        <Button onClick={handleSubmit} variant="contained">Update Resident</Button>
      </DialogActions>
    </Dialog>
  );
}