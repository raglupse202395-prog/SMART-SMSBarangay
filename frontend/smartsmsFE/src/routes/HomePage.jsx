import React from 'react';
import { Link } from 'react-router-dom'; 
import '../styles/Homepage.css';
import ServicesSection from '../components/Homepage/ServiceSection';
import { FaFacebookF, FaYoutube, FaTwitter, FaPhone, FaUsers, FaShieldAlt, FaMobileAlt, FaHeart } from 'react-icons/fa';

const HomePage = () => {
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const today = new Date();
    const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    const dateTimeString = today.toLocaleString('en-US', options);

    return (
        <div className="site-container">
            {/* Top Header Bar */}
            <div className="top-header">
                <div className="top-header-content">
                    <div className="site-title">GOVPH | The Official Website of Barangay Poblacion 1, Clarin, Misamis Occidental</div>
                    <div className="social-icons-top">
                        <a href="#" className="social-icon"><FaFacebookF /></a>
                        <a href="#" className="social-icon"><FaYoutube /></a>
                        <a href="#" className="social-icon"><FaTwitter /></a>
                        <a href="#" className="social-icon"><FaPhone /></a>
                    </div>
                    <div className="date-time">
                        Philippine Standard Time:<br />
                        {dateTimeString}
                    </div>
                </div>
            </div>

            {/* Main Navigation Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo-container">
                        {/* Must be saved as header-logos.png in public folder */}
                        <img src="/header-logos.png" alt="Bagong Pilipinas - Clarin - Asenso" className="header-logos-img" />
                    </div>
                    <nav className="navbar">
                        <button onClick={() => scrollToSection('home')} className="nav-item nav-button">Home</button>
                        <button onClick={() => scrollToSection('about')} className="nav-item nav-button">About</button>
                        <button onClick={() => scrollToSection('services')} className="nav-item nav-button">Online Services</button>
                        <button onClick={() => scrollToSection('contact')} className="nav-item nav-button">Contact</button>
                        <Link to="/loginPage" className="nav-item admin-login-btn">Admin Login</Link>
                    </nav>
                </div>
            </header>

            {/* Hero Banner Section */}
            <main className="main-content" id="home">
                <div className="banner">
                    <div className="banner-content">
                        <div className="banner-left">
                            <h2 className="smart-text">Smart</h2>
                            <h1 className="barangay-text">BARANGAY<br/>POBLACION 1</h1>
                            <div className="slogan">
                                <p className="slogan-line">TODAY'S INNOVATIONS,</p>
                                <p className="slogan-line">TOMORROW'S COMMUNITY.</p>
                                <p className="website-url">smartsms-barangay.onrender.com</p>
                            </div>
                        </div>
                        
                        <div className="banner-center">
                            {/* Must be saved as asenso-face.png in public folder */}
                            <img src="/asenso-face.png" alt="Governor of Misamis Occidental" />
                        </div>
                    </div>
                </div>
            </main>

            {/* About Section */}
            <section className="about-section" id="about">
                <div className="about-container">
                    <h2 className="about-title">About Barangay Poblacion 1</h2>
                    <div className="about-grid">
                        <div className="about-item">
                            <h3>Our Community</h3>
                            <p>
                                Barangay Poblacion 1, Clarin, Misamis Occidental serves as the smallest administrative division
                                and the foundation of local governance in our community. As your local government unit,
                                we are committed to delivering essential services and fostering community development
                                for all residents.
                            </p>
                        </div>
                        <div className="about-item">
                            <h3>Our Mission</h3>
                            <p>
                                We strive to provide responsive, transparent, and efficient public services while
                                promoting peace, order, and sustainable development within our barangay. Through
                                innovative digital solutions like SmartSMS, we bridge the gap between traditional
                                governance and modern technology.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Online Services Component */}
            <div id="services">
                <ServicesSection />
            </div>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="contact-container">
                    <h2 className="contact-title">Contact Us</h2>
                    <div className="contact-info">
                        <div className="contact-item">
                            <h3>Barangay Office</h3>
                            <p>Barangay Poblacion 1, Clarin, Misamis Occidental</p>
                            <p>Email: brgypoblacion1@clarin.gov.ph</p>
                        </div>
                        <div className="contact-item">
                            <h3>Office Hours</h3>
                            <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                            <p>Saturday: 8:00 AM - 12:00 PM</p>
                        </div>
                        <div className="contact-item">
                            <h3>Follow Us</h3>
                            <p>Stay updated with our latest announcements.</p>
                            <a href="#" className="footer-link" style={{marginTop: '10px', display: 'inline-block'}}>Facebook Page</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2025 Barangay Poblacion 1, Clarin, Misamis Occidental. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;