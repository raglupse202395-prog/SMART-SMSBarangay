import React, { useState } from 'react';

const ApprovalModal = ({ isOpen, onClose, onApprove, requestData }) => {
    const [approvalDetails, setApprovalDetails] = useState({
        pickupDate: '',
        pickupTime: '',
        instructions: '',
        officeHours: 'Monday to Friday, 8:00 AM - 5:00 PM'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onApprove(requestData._id || requestData.id, approvalDetails);
            onClose();
            setApprovalDetails({ pickupDate: '', pickupTime: '', instructions: '', officeHours: 'Monday to Friday, 8:00 AM - 5:00 PM' });
        } catch (error) {
            console.error('Error approving request:', error);
            let errorMsg = "Unknown error";
            if (error.response && error.response.data) {
                errorMsg = JSON.stringify(error.response.data);
            } else if (error.message) {
                errorMsg = error.message;
            }
            alert("❌ Failed to approve: " + errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setApprovalDetails({ ...approvalDetails, [e.target.name]: e.target.value });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Approve Document Request</h3>
                    <button className="modal-close" onClick={onClose} disabled={isSubmitting}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="request-info">
                        <p><strong>Requester:</strong> {requestData?.fullName}</p>
                        <p><strong>Email:</strong> {requestData?.email}</p>
                        <p><strong>Phone:</strong> {requestData?.phoneNumber}</p>
                        <p><strong>Document:</strong> {requestData?.documentType}</p>
                        <p><strong>Purpose:</strong> {requestData?.purpose}</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="pickupDate">Available Pickup Date (Required):</label>
                            <input type="date" id="pickupDate" name="pickupDate" value={approvalDetails.pickupDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pickupTime">Preferred Pickup Time (Required):</label>
                            <input type="time" id="pickupTime" name="pickupTime" value={approvalDetails.pickupTime} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="officeHours">Office Hours:</label>
                            <input type="text" id="officeHours" name="officeHours" value={approvalDetails.officeHours} onChange={handleChange} placeholder="e.g., Monday to Friday, 8:00 AM - 5:00 PM" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="instructions">Additional Instructions:</label>
                            <textarea id="instructions" name="instructions" value={approvalDetails.instructions} onChange={handleChange} rows="3" placeholder="Please bring valid ID, etc..." />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="cancel-button" disabled={isSubmitting}>Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="approve-button">
                                {isSubmitting ? 'Sending Notifications...' : 'Approve, Send Email & SMS'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;