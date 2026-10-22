import React, { useState } from 'react';
import '../../styles/ServiceSection.css';
import RequestModal from './RequestModal';

const ServicesSection = () => {
    const [hoveredService, setHoveredService] = useState(null);
    const [requestSubmitted, setRequestSubmitted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const handleServiceHover = (index) => setHoveredService(index);
    const handleServiceLeave = () => setHoveredService(null);
    const handleRequestNow = (service) => { setSelectedService(service); setIsModalOpen(true); };
    const handleModalClose = () => setIsModalOpen(false);
    const handleRequestSuccess = () => {
        setRequestSubmitted(true);
        setTimeout(() => setRequestSubmitted(false), 3000);
    };

    const services = [
        {
            id: 1,
            title: "Barangay Clearance",
            icon: "fas fa-id-card",
            description: "An official document certifying that the individual has no derogatory record in the barangay.",
            bgImage: "cert1.jpg" // You can change this if you have a clearance image
        },
        {
            id: 2,
            title: "Certificate of Residency",
            icon: "fas fa-map-marker-alt",
            description: "Certification proving residency within the barangay for various legal and government requirements.",
            bgImage: "cert2.jpg"
        },
        {
            id: 3,
            title: "Certificate of Indigency",
            icon: "fas fa-hand-holding-heart",
            description: "Document issued to low-income individuals for access to social welfare and financial aid programs.",
            bgImage: "cert3.jpg"
        },
        {
            id: 4,
            title: "Certificate of Low Income",
            icon: "fas fa-medkit",
            description: "Endorsement and support for Low Income households.",
            bgImage: "cert4.jpg"
        },
    ];

    return (
        <div className="services-section">
            <div className="services-header">
                <h2>Online Services</h2>
                <p>Barangay Certification: Medical Assistance | 4P's Validation | Indigency | Clearance | More</p>
                <span className="services-subtitle">
                    Effortless Access, One Click Away: Barangay Poblacion 1 Launches Online Services for Seamless Barangay Certification
                </span>
            </div>

            <div className="services-grid">
                {services.map((service, index) => (
                    <div
                        key={service.id}
                        className={`service-card ${hoveredService === index ? 'hovered' : ''}`}
                        onMouseEnter={() => handleServiceHover(index)}
                        onMouseLeave={handleServiceLeave}
                        style={{
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${service.bgImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="service-content">
                            <div className="service-icon">
                                <i className={service.icon}></i>
                            </div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                            <button
                                className="request-button"
                                onClick={() => handleRequestNow(service)}
                            >
                                <i className="fas fa-paper-plane"></i> Request Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedService && (
                <RequestModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    documentType={selectedService.title}
                    onSubmit={handleRequestSuccess}
                />
            )}

            {requestSubmitted && (
                <div className="request-confirmation">
                    <div className="confirmation-content">
                        <i className="fas fa-check-circle"></i>
                        <p>Your request has been submitted successfully!</p>
                        <p>Please check your email for further instructions.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesSection;