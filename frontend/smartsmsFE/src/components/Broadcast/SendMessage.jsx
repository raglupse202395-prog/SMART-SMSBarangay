import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useState } from 'react';
import service from '../../services/service';
import TemplateDropdown from './TemplateDropdown';
import { CircularProgress } from '@mui/material';

export default function SendMessage({ selectedResidentsNumber = [], broadcastType }) {
    const [message, setMessage] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleBroadcast = async () => {
        if (!broadcastType || broadcastType.trim() === "") {
            alert("Please select a broadcast type!");
            return;
        }
        if (!message.trim()) {
            alert("Message cannot be empty!");
            return;
        }
        if (selectedResidentsNumber.length === 0) {
            alert("No recipients selected!");
            return;
        }

        try {
            setIsSending(true);
            // Call backend API
            await service.sendSms(selectedResidentsNumber, message, "Admin", broadcastType);
            
            alert("✅ Broadcast sent successfully! Check your phone.");
            setMessage(""); // Clear message on success
            
        } catch (error) {
            console.error("Error sending broadcast:", error);
            // Show the EXACT error from the backend
            const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message || "Unknown network error";
            alert(`❌ Failed to send broadcast:\n\n${errorMsg}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className='broadcast-main'>
            <div className="section-headder">
                <h6>Compose Message</h6>
                <div className="message-length-display">{message.length}/160 characters</div>
            </div>
            <textarea
                name="broadcast-message"
                id="broadcast-message"
                placeholder="Type Your Announcement Here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={160}
                disabled={isSending}
            ></textarea>
            <TemplateDropdown
                setMessage={setMessage}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
            />
            <div className="receipients-selected-number">
                <PeopleAltIcon></PeopleAltIcon>
                <div>{selectedResidentsNumber.length} Recipients Selected</div>
            </div>
            
            <div 
                className='send-announcement-button' 
                style={{ cursor: isSending ? "not-allowed" : "pointer", opacity: isSending ? 0.7 : 1 }} 
                onClick={!isSending ? handleBroadcast : null}
            >
                {isSending ? <CircularProgress size={20} style={{ color: 'white' }} /> : <CampaignIcon />}
                <div>{isSending ? "Sending to Gateway..." : "Send Announcement"}</div>
            </div>
        </div>
    )
}