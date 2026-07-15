import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Search, ArrowLeft, Phone, Calendar, Clock, User, Building, AlertCircle, QrCode, FileText } from 'lucide-react';
import { api } from '../utils/api';

export default function VisitorStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phoneQuery, setPhoneQuery] = useState(searchParams.get('phone') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!phoneQuery) return;
    
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await api.get(`/visitors/status/${encodeURIComponent(phoneQuery)}`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'No visit records found for this phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically if phone parameter is in URL
  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) {
      setPhoneQuery(phone);
      // Wait for components to mount fully
      setTimeout(() => {
        const btn = document.getElementById('searchBtn');
        if (btn) btn.click();
      }, 100);
    }
  }, [searchParams]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Approved': return 'bg-success text-white';
      case 'CheckedIn': return 'bg-primary text-white';
      case 'CheckedOut': return 'bg-secondary text-white';
      case 'Rejected': return 'bg-danger text-white';
      default: return 'bg-dark text-white';
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Header */}
      <header className="px-4 py-3 d-flex justify-content-between align-items-center border-bottom" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <div className="bg-primary bg-opacity-25 p-2 rounded-3 border border-primary border-opacity-50">
            <Shield className="text-primary" size={20} />
          </div>
          <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            VMS<span className="text-primary">.io</span>
          </span>
        </Link>
        <Link to="/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5" style={{ borderRadius: '8px' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 container py-5" style={{ maxWidth: '600px' }}>
        <div className="glass-card p-4 p-md-5 animate-slide-up">
          
          <div className="text-center mb-5">
            <h2 className="h3 fw-bold text-white mb-2">Track Pass Status</h2>
            <p className="text-secondary small">Enter your phone number to check the approval status of your visit request.</p>
          </div>

          <form onSubmit={handleSearch} className="mb-4">
            <div className="d-flex gap-2">
              <div className="position-relative flex-grow-1">
                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  className="form-control form-control-custom ps-5"
                  placeholder="Enter phone number (+1-555-0123)"
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                id="searchBtn"
                className="btn btn-primary-custom px-4 d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>
                    <Search size={16} />
                    <span className="d-none d-sm-inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="bg-dark bg-opacity-40 p-4 rounded-3 border animate-fade-in" style={{ borderColor: 'var(--border-color)' }}>
              
              {/* Header result */}
              <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <h3 className="h5 fw-bold text-white mb-1">{result.visitor.fullName}</h3>
                  <span className="small text-muted">{result.visitor.company || 'Private Visit'}</span>
                </div>
                <span className={`badge badge-custom ${getStatusBadgeClass(result.visit.status)}`}>
                  {result.visit.status}
                </span>
              </div>

              {/* Visit Details */}
              <div className="d-flex flex-column gap-3 mb-4">
                
                <div className="d-flex gap-3">
                  <User size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="small text-muted d-block">Host Employee</span>
                    <span className="text-white small fw-medium">{result.hostName}</span>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <Calendar size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="small text-muted d-block">Appointment Date</span>
                    <span className="text-white small fw-medium">{result.visit.scheduledDate}</span>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <Clock size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="small text-muted d-block">Scheduled Time</span>
                    <span className="text-white small fw-medium">{result.visit.scheduledTime}</span>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <FileText size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="small text-muted d-block">Purpose of Visit</span>
                    <span className="text-white small fw-medium">{result.visit.purpose}</span>
                  </div>
                </div>

              </div>

              {/* Status explanation & actions */}
              <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                {result.visit.status === 'Pending' && (
                  <div className="alert alert-warning m-0 small py-2 px-3">
                    Your request is in queue. The host employee has been notified to approve your visit. Please wait or refresh.
                  </div>
                )}

                {result.visit.status === 'Rejected' && (
                  <div className="alert alert-danger m-0 small py-2 px-3">
                    Your visit request has been declined by the host. Please check credentials or reschedule.
                  </div>
                )}

                {(result.visit.status === 'Approved' || result.visit.status === 'CheckedIn' || result.visit.status === 'CheckedOut') && (
                  <div className="d-flex flex-column gap-2">
                    <div className="alert alert-success small py-2 px-3 mb-3">
                      {result.visit.status === 'Approved' 
                        ? 'Your request is approved! Click below to download your digital entry badge.' 
                        : 'Your pass remains active for history tracking. View details below.'}
                    </div>
                    <Link
                      to={`/pass/${result.visit.id}`}
                      className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2-5"
                      style={{ borderRadius: '10px' }}
                    >
                      <QrCode size={16} />
                      <span>Download Entry Pass / QR Code</span>
                    </Link>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
