import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, Users, BookOpen, Clock, ScanFace, FileText, ArrowRight, UserPlus, ClipboardList } from 'lucide-react';

export default function Landing() {
  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%), radial-gradient(circle at 10% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)' }}>
      
      {/* Navbar */}
      <header className="px-4 py-3 d-flex justify-content-between align-items-center border-bottom" style={{ borderColor: 'var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary bg-opacity-25 p-2 rounded-3 border border-primary border-opacity-50">
            <Shield className="text-primary" size={24} />
          </div>
          <span className="fs-4 fw-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            VMS<span className="text-primary">.io</span>
          </span>
        </div>
        <Link to="/login" className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2" style={{ borderRadius: '10px' }}>
          <Key size={16} />
          <span>Staff Login</span>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center px-4 py-5">
        <div className="row justify-content-center text-center mb-5">
          <div className="col-lg-8 col-xl-7">
            <span className="badge bg-primary bg-opacity-15 text-primary mb-3 px-3 py-2 border border-primary border-opacity-25" style={{ borderRadius: '20px', fontSize: '14px' }}>
              Secure & Paperless Visitor Management
            </span>
            <h1 className="display-4 fw-extrabold mb-4" style={{ fontFamily: 'var(--font-heading)', lineHeight: '1.15' }}>
              Next-Gen Visitor Flow <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                For Modern Workplaces
              </span>
            </h1>
            <p className="lead text-secondary mb-5 fs-5">
              Automate the complete visitor lifecycle. From pre-registration and host approval to QR check-in, meeting room allocation, and real-time security tracking.
            </p>
          </div>
        </div>

        {/* Portal Entry Cards */}
        <div className="container px-4">
          <div className="row g-4 justify-content-center">
            
            {/* Guest Pre-Registration Card */}
            <div className="col-md-5 col-lg-4">
              <div className="glass-card h-100 p-4 d-flex flex-column align-items-start justify-content-between position-relative overflow-hidden" style={{ borderTop: '4px solid var(--visitor-color)' }}>
                <div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary mb-4 d-inline-block">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="h4 fw-bold mb-3">Guest Registration</h3>
                  <p className="text-secondary small mb-4">
                    Visiting someone? Pre-register your details, capture a photo, upload ID, and schedule your appointment to receive your QR pass instantly.
                  </p>
                </div>
                <Link to="/register-visitor" className="btn btn-outline-primary d-flex align-items-center gap-2 w-100 justify-content-center mt-3 py-2-5" style={{ borderRadius: '10px' }}>
                  <span>Register Visit</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Check status Card */}
            <div className="col-md-5 col-lg-4">
              <div className="glass-card h-100 p-4 d-flex flex-column align-items-start justify-content-between position-relative overflow-hidden" style={{ borderTop: '4px solid var(--receptionist-color)' }}>
                <div>
                  <div className="p-3 rounded-4 mb-4 d-inline-block" style={{ backgroundColor: 'var(--receptionist-bg)', color: 'var(--receptionist-color)' }}>
                    <ClipboardList size={32} />
                  </div>
                  <h3 className="h4 fw-bold mb-3">Check Pass Status</h3>
                  <p className="text-secondary small mb-4">
                    Already registered? Enter your phone number to check your host approval status, update meeting details, or download your digital entry badge.
                  </p>
                </div>
                <Link to="/status" className="btn btn-outline-warning d-flex align-items-center gap-2 w-100 justify-content-center mt-3 py-2-5" style={{ borderRadius: '10px', color: 'var(--receptionist-color)', borderColor: 'var(--receptionist-color)' }}>
                  <span>Track Status</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Highlights */}
        <section className="container mt-5 pt-5 border-top" style={{ borderColor: 'var(--border-color)' }}>
          <div className="row g-4 text-start">
            <div className="col-md-4">
              <div className="d-flex gap-3">
                <div className="text-primary flex-shrink-0">
                  <ScanFace size={24} />
                </div>
                <div>
                  <h5 className="fw-semibold">Webcam Verification</h5>
                  <p className="small text-secondary">
                    Capture secure, high-quality face photos during kiosks or online registration for digital identity check-ins.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex gap-3">
                <div className="text-success flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h5 className="fw-semibold">Real-Time Approvals</h5>
                  <p className="small text-secondary">
                    Hosts receive instant notifications when guests request entry. Approved visitors receive QR passes automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex gap-3">
                <div className="text-info flex-shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h5 className="fw-semibold">Digital NDA / Agreements</h5>
                  <p className="small text-secondary">
                    Embed corporate NDAs and safety protocols directly inside registration flow to capture visitor electronic signatures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center mt-5 border-top" style={{ borderColor: 'var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
        <p className="mb-0">
          © {new Date().getFullYear()} Visitor Management System. All rights reserved. Secure, paperless, enterprise authentication.
        </p>
      </footer>

    </div>
  );
}
