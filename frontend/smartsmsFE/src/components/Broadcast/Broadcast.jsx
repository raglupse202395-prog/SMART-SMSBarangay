import '../../styles/Broadcast.css'
import { useState, useEffect, useMemo } from 'react'
import AnnouncementOptions from './announcementOptions'
import Receipients from './Receipients'
import SendMessage from './SendMessage'
import MainTemplate from '../MainTemplate'
import residentService from '../../services/service'
import { Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material'

export default function Broadcast() {
    const [broadcastValue, setBroadcastValue] = useState("");
    const broadcastTypes = ["Local", "Gift Giving", "Medicine", "Garbage Collection"]
    const setBroadcastOnChange = (e) => setBroadcastValue(e.target.value)

    const [announcement, setAnnouncement] = useState('');
    const [allResidents, setallResidents] = useState([])
    const [recipientType, setRecipientType] = useState('all'); // 'all' or 'heads'

    useEffect(() => {
        const fetchResidents = async () => {
            try {
                const response = await residentService.getResidents();
                // Map data and ensure isHouseholdHead is included
                const mappedResidents = response.map((resident) => ({
                    id: resident._id,
                    name: `${resident.first_name} ${resident.middle_name ? resident.middle_name + ' ' : ''}${resident.last_name} ${resident.suffix || ''}`.trim(),
                    age: resident.age,
                    gender: resident.gender,
                    marital_status: resident.marital_status,
                    street: resident.address?.street || '',
                    phone: resident.contact?.phone || '',
                    highest_education: resident.education?.highest_education,
                    resident_type: resident.registration?.resident_type,
                    medical_conditions: resident.medical_info?.medical_conditions || [],
                    isHouseholdHead: resident.isHouseholdHead || false, 
                    householdId: resident.householdId?.householdId || null,
                    checked: false
                }));
                setallResidents(mappedResidents);
            } catch (err) {
                console.error('Error fetching residents:', err);
            }
        };
        fetchResidents();
    }, [])

    const [filters, setFilters] = useState({
        minAge: "",
        maxAge: "",
        gender: "",
        marital_status: "",
        street: "",
        highest_education: "",
        resident_type: "",
        medical_condition: "",
    });

    const filteredResidents = useMemo(() => {
        return allResidents.filter(resident => {
            // First, filter by Household Head or All
            if (recipientType === 'heads' && !resident.isHouseholdHead) return false;

            // Then apply other filters
            if (filters.minAge && resident.age < Number(filters.minAge)) return false;
            if (filters.maxAge && resident.age > Number(filters.maxAge)) return false;
            if (filters.gender && resident.gender !== filters.gender) return false;
            if (filters.marital_status && resident.marital_status !== filters.marital_status) return false;
            if (filters.address && !(resident.street.toLowerCase().includes(filters.address.toLowerCase()))) return false;
            if (filters.highest_education && resident.highest_education !== filters.highest_education) return false;
            if (filters.resident_type && resident.resident_type !== filters.resident_type) return false;
            if (filters.medical_condition && !(resident.medical_conditions || []).includes(filters.medical_condition)) return false;
            
            return true;
        });
    }, [allResidents, filters, recipientType]);

    const [selectedResidentsNumber, setselectedResidentsNumber] = useState([])

    return (
        <MainTemplate headerName={"Broadcast"} cardHeader={"Create New Announcement"}>
            
            {/* RECIPIENT TYPE SELECTOR */}
            <div style={{ padding: '0 20px', marginBottom: '-10px' }}>
                <FormControl component="fieldset">
                    <FormLabel component="legend" style={{ fontWeight: 'bold', color: '#0038A8' }}>Send To:</FormLabel>
                    <RadioGroup 
                        row 
                        value={recipientType} 
                        onChange={(e) => {
                            setRecipientType(e.target.value);
                            setselectedResidentsNumber([]); // Clear selected when switching
                        }}
                    >
                        <FormControlLabel value="all" control={<Radio />} label="All Residents" />
                        <FormControlLabel value="heads" control={<Radio />} label="Household Heads Only" />
                    </RadioGroup>
                </FormControl>
            </div>

            <div className='broadcast-layout'>
                <AnnouncementOptions
                    broadcastTypes={broadcastTypes}
                    broadcastValue={broadcastValue}
                    setBroadcastOnChange={setBroadcastOnChange}
                    allResidents={allResidents}
                    filters={filters}
                    setFilters={setFilters}
                />
                <Receipients
                    receipients={filteredResidents}
                    selectedResidentsNumber={selectedResidentsNumber}
                    setselectedResidentsNumber={setselectedResidentsNumber}
                    recipientType={recipientType}
                />
                <SendMessage selectedResidentsNumber={selectedResidentsNumber} broadcastType={broadcastValue} />
            </div>
        </MainTemplate>
    )
}