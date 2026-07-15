import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Printer, ArrowLeft, Calendar, Clock, MapPin, Briefcase, User, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

export default function VisitorPass() {
  const { visitId } = useParams();
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPass() {
      try {
        const data = await api.get(`/visitors/pass/${visitId}`);
        setPassData(data.pass);
      } catch (err) {
        setError(err.message || 'Failed to retrieve visitor pass details.');
      } finally {
        setLoading(false);
      }
    }
    loadPass();
  }, [visitId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container-fluid min-vh-100 p-0 d-flex flex-column align-items-center justify-content-center" style={{ background: '#0a0b10' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid min-vh-100 p-0 d-flex flex-column align-items-center justify-content-center" style={{ background: '#0a0b10' }}>
        <div className="glass-card p-5 text-center" style={{ maxWidth: '400px' }}>
          <h2 className="h4 text-danger fw-bold mb-3">Error Loading Pass</h2>
          <p className="text-secondary small mb-4">{error}</p>
          <Link to="/" className="btn btn-outline-secondary">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Header (hidden in print) */}
      <header className="px-4 py-3 d-flex justify-content-between align-items-center border-bottom no-print" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <div className="bg-primary bg-opacity-25 p-2 rounded-3 border border-primary border-opacity-50">
            <Shield className="text-primary" size={20} />
          </div>
          <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            VMS<span className="text-primary">.io</span>
          </span>
        </Link>
        <div className="d-flex gap-2">
          <button onClick={handlePrint} className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: '8px' }}>
            <Printer size={16} /> Print Pass
          </button>
          <Link to="/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5" style={{ borderRadius: '8px' }}>
            Home
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow-1 d-flex flex-column align-items-center justify-content-center py-5 px-3">
        
        {/* Visitor Pass layout (Print area) */}
        <div className="print-area w-100 animate-slide-up" style={{ maxWidth: '400px' }}>
          
          <div className="glass-card overflow-hidden" style={{ border: '2px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', backgroundColor: 'var(--bg-secondary)' }}>
            
            {/* Header Badge */}
            <div className="visitor-gradient p-4 text-center text-white position-relative">
              <div className="position-absolute top-0 end-0 p-3 opacity-20">
                <Sparkles size={40} />
              </div>
              <h2 className="fs-5 fw-bold mb-1 tracking-wider text-uppercase" style={{ fontFamily: 'var(--font-heading)' }}>Visitor Pass</h2>
              <span className="badge bg-black bg-opacity-40 text-uppercase fw-semibold" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                {passData.status}
              </span>
            </div>

            {/* Content Badge */}
            <div className="p-4 text-center d-flex flex-column align-items-center gap-3">
              
              {/* Photo */}
              <div className="border border-3 border-dark rounded-circle overflow-hidden bg-black" style={{ width: '120px', height: '120px' }}>
                {passData.photoUrl ? (
                  <img src={passData.photoUrl.startsWith('data:') ? passData.photoUrl : `http://localhost:5000${passData.photoUrl}`} alt={passData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-dark">
                    <User size={64} />
                  </div>
                )}
              </div>

              {/* Name and Company */}
              <div>
                <h3 className="h4 fw-bold text-white mb-1">{passData.fullName}</h3>
                <span className="text-secondary small fw-medium">{passData.company || 'Private Guest'}</span>
              </div>

              {/* Details table */}
              <div className="w-100 mt-2 bg-dark bg-opacity-30 rounded-3 p-3 text-start border" style={{ borderColor: 'var(--border-color)', fontSize: '13px' }}>
                <div className="row g-2 mb-2 pb-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="col-5 text-secondary">Meeting Host:</div>
                  <div className="col-7 text-white fw-semibold">{passData.hostName} ({passData.department})</div>
                </div>
                <div className="row g-2 mb-2 pb-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="col-5 text-secondary">Date:</div>
                  <div className="col-7 text-white fw-semibold">{passData.scheduledDate}</div>
                </div>
                <div className="row g-2 mb-2 pb-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="col-5 text-secondary">Arrival Time:</div>
                  <div className="col-7 text-white fw-semibold">{passData.scheduledTime}</div>
                </div>
                <div className="row g-2">
                  <div className="col-5 text-secondary">Meeting Room:</div>
                  <div className="col-7 text-white fw-semibold d-flex align-items-center gap-1">
                    <MapPin size={12} className="text-primary" />
                    <span>{passData.meetingRoom} (Floor {passData.floor || 'TBD'})</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="my-3 p-2 bg-white rounded-3 shadow-sm border border-secondary border-opacity-10 d-inline-block">
                <img src={passData.qrCode} alt="Entry Scan QR" style={{ width: '150px', height: '150px' }} />
              </div>

              <div className="no-print">
                <p className="small text-secondary mb-0" style={{ fontSize: '11px', maxWidth: '300px' }}>
                  Please present this QR code to the gate security guard or receptionist upon arrival to check in.
                </p>
              </div>

            </div>

            {/* Footer Badge */}
            <div className="bg-dark p-3 text-center border-top text-muted small" style={{ borderColor: 'var(--border-color)', fontSize: '11px' }}>
              ID: {passData.visitId.toUpperCase()}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
