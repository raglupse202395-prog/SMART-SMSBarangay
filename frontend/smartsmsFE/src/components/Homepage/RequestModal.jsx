import React, { useState } from 'react';
import '../../styles/RequestModal.css';
import apiService from '../../services/service';

const RequestModal = ({ isOpen, onClose, documentType, onsubmit }) => {
    const [formatData, setFormData] = useState({
        fullName: '', email: '', phoneNumber: '', address: '', purpose:'', documentType: documentType
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ... FormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            await apiService.submitDocumentRequest(formData);
            onsubmit();
            onClose();
        } catch (error) {
            let errorMsg = 'Failed to submit request. Server might be waking up.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message;
            }
            setErrorMessage(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className= "modal-container">
                <div className="modal-header">
                    <h2>Request {documentType}</h2>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body">

                    <div style={{background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'}}>
                        <i className="fas fa-info-circle"></i> <b>Note:</b> Yourrequest will be sent to you Purok President forinitial before it is forwarded to the Barangay Hall.
                    </div>

                    {errorMessage && (
                        <div className="error-message" style={{background: '#fee2e2', color: '#b91c1', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>
                            <i className="fas fa-exclamation-circle"></i> {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name *</label>
                            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Juan Dela Cruz" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input type="email" id="email" name="email" value={formData.email} onChnage={handleChange} required placeholder="example@email.com" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number *</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="+639123456789" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Complete Address *</label>
                            <textarea id="address" name="address" value={formData.address} onChange={handleChange} required placeholder="House/Unit Number, Street, Barangay"></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="purpose">Purpose *</label>
                            <textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} required placeholder="Please state the purpose of your request"></textarea>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
                            <button type="submit" className="submit-button" disabled={isSubmitting}>
                                {isSubmitting ? (<><i className="fas fa-spinner fa-spin"></i> Submitting...</>) : (<><i className="fas fa-paper-plane"></i> Submit for Purok Approval</>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;
