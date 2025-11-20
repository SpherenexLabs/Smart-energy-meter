import React from 'react';
import './Home.css';

const Home = ({ onNavigate }) => {
              return (
                <div className="home">
                  {/* Hero Banner Section */}
                  <section className="hero-banner">
                    <div className="container">
                      <div className="hero-content">
                        <div className="hero-left">
                          <div className="infrastructure-illustration">
                            <img 
                              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjBmOWZmIi8+CjwhLS0gUG93ZXIgVHJhbnNtaXNzaW9uIFRvd2VycyAtLT4KPHN2ZyB4PSI1MCIgeT0iMTAwIj4KICA8cG9seWdvbiBwb2ludHM9IjAsMTUwIDIwLDE0MCAyMCwwIDQwLDAgNDAsMTQwIDYwLDE1MCA0MCwxNjAgNDAsMjAwIDIwLDIwMCAyMCwxNjAiIGZpbGw9IiM2NjY2NjYiLz4KICA8bGluZSB4MT0iMzAiIHkxPSIwIiB4Mj0iMzAiIHkyPSIyMDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjwvdGV4dD4KPCEtLSBCdWlsZGluZ3MgLS0+CjxyZWN0IHg9IjMwMCIgeT0iMTIwIiB3aWR0aD0iODAiIGhlaWdodD0iMTgwIiBmaWxsPSIjNGZiMWQzIi8+CjxyZWN0IHg9IjM5MCIgeT0iMTAwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzY4MWIzIi8+CjxyZWN0IHg9IjQ2MCIgeT0iMTQwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTYwIiBmaWxsPSIjNWY5ZWQ0Ii8+CjwhLS0gVHJlZXMgLS0+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjI0MCIgcj0iMTUiIGZpbGw9IiM0Y2FmNTAiLz4KPHJlY3QgeD0iMTk3IiB5PSIyNTAiIHdpZHRoPSI2IiBoZWlnaHQ9IjIwIiBmaWxsPSIjOGQ2ZTYzIi8+CjxjaXJjbGUgY3g9IjI0MCIgY3k9IjI1MCIgcj0iMTIiIGZpbGw9IiM0Y2FmNTAiLz4KPHJlY3QgeD0iMjM3IiB5PSIyNjAiIHdpZHRoPSI2IiBoZWlnaHQ9IjE1IiBmaWxsPSIjOGQ2ZTYzIi8+CjwhLS0gUG93ZXIgTGluZXMgLS0+CjxsaW5lIHgxPSIxMTAiIHkxPSIxMDAiIHgyPSIzMDAiIHkyPSIxMjAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxsaW5lIHgxPSIzODAiIHkxPSIxMjAiIHgyPSI0NjAiIHkyPSIxNDAiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIzIi8+CjwhLS0gSG91c2VzIC0tPgo8cG9seWdvbiBwb2ludHM9IjE1MCwyNTAgMTcwLDIzMCAxOTAsMjUwIDE5MCwyODAgMTUwLDI4MCIgZmlsbD0iI2ZmOTgwMCIvPgo8cG9seWdvbiBwb2ludHM9IjE1NSwyNTAgMTcwLDIzNSAxODUsMjUwIiBmaWxsPSIjZGQ3MzFmIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMzMzMyI+UG93ZXIgSW5mcmFzdHJ1Y3R1cmU8L3RleHQ+CjwvdGV4dD4=" 
                              alt="Power Infrastructure" 
                              className="infrastructure-img"
                            />
                          </div>
                        </div>
                        <div className="hero-right">
                          <div className="pay-bill-section">
                            <h1 className="pay-bill-title">PAY BILL<br />ONLINE</h1>
                            <div className="payment-card">
                              <div className="credit-card">
                                <div className="card-icon">💳</div>
                                <div className="card-details">
                                  <div className="card-chips">■■■■</div>
                                  <div className="card-number">•••• •••• •••• ••••</div>
                                </div>
                              </div>
                              <button className="pay-button" onClick={() => onNavigate('login')}>
                                PAY
                              </button>
                            </div>
                            <div className="quick-payment">
                              <button className="btn btn-secondary quick-pay-btn" onClick={() => onNavigate('login')}>
                                QUICK PAYMENT
                                <span className="quick-pay-icon">⚡</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Services Section */}
                  <section className="services-section section">
                    <div className="container">
                      <div className="section-header">
                        {/* ...existing code... */}
                      </div>
                      <div className="services-list">
                        <div className="service-card">
                          <div className="service-icon">💳</div>
                          <h3 className="service-title">Pay Bill</h3>
                          <p className="service-description">Pay your electricity bill online securely</p>
                          <button className="btn btn-outline" onClick={() => onNavigate('login')}>
                            Pay Now
                          </button>
                        </div>
                        <div className="service-card">
                          <div className="service-icon">📊</div>
                          <h3 className="service-title">Usage Monitoring</h3>
                          <p className="service-description">Track your electricity consumption and manage usage</p>
                          <button className="btn btn-outline" onClick={() => onNavigate('login')}>
                            View Usage
                          </button>
                        </div>
                        <div className="service-card">
                          <div className="service-icon">🔧</div>
                          <h3 className="service-title">Service Requests</h3>
                          <p className="service-description">Submit service requests and track their status</p>
                          <button className="btn btn-outline" onClick={() => onNavigate('login')}>
                            Request Service
                          </button>
                        </div>
                        <div className="service-card">
                          <div className="service-icon">📞</div>
                          <h3 className="service-title">Customer Support</h3>
                          <p className="service-description">Get help and support for all your queries</p>
                          <button className="btn btn-outline">
                            Contact Us
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Features Section */}
                  <section className="features-section section">
                    <div className="container">
                      <div className="features-content">
                        <div className="features-text">
                          <h2 className="features-title">Why Choose BESCOM Online?</h2>
                          <div className="features-list">
                            <div className="feature-item">
                              <span className="feature-icon">✓</span>
                              <span className="feature-text">24/7 Online Bill Payment</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">✓</span>
                              <span className="feature-text">Real-time Usage Tracking</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">✓</span>
                              <span className="feature-text">Instant Payment Confirmation</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">✓</span>
                              <span className="feature-text">Secure Transaction Processing</span>
                            </div>
                            <div className="feature-item">
                              <span className="feature-icon">✓</span>
                              <span className="feature-text">Mobile-Friendly Interface</span>
                            </div>
                          </div>
                          <div className="cta-buttons">
                            <button className="btn btn-primary" onClick={() => onNavigate('login')}>
                              Get Started
                            </button>
                            <button className="btn btn-outline">
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              );
            };

export default Home;