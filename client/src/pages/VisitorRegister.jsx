import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Phone, Building, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, FileCheck, Landmark } from 'lucide-react';
import { api } from '../utils/api';
import WebcamCapture from '../components/WebcamCapture';

export default function VisitorRegister() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('Business Meeting');
  const [hostId, setHostId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(new Date().toTimeString().substring(0, 5));
  const [idType, setIdType] = useState('National ID');
  const [photoData, setPhotoData] = useState('');
  const [ndaChecked, setNdaChecked] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  // Load Organizations on Mount
  useEffect(() => {
    async function loadOrgs() {
      try {
        const data = await api.get('/visitors/organizations');
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load organizations.');
      }
    }
    loadOrgs();
  }, []);

  // Load Host Employees when Organization changes
  useEffect(() => {
    async function loadHosts() {
      if (!selectedOrgId) {
        setHosts([]);
        setHostId('');
        return;
      }
      try {
        const data = await api.get(`/visitors/hosts?orgId=${selectedOrgId}`);
        setHosts(data);
        if (data.length > 0) {
          setHostId(data[0].id);
        } else {
          setHostId('');
        }
      } catch (err) {
        setError('Failed to load host employee list.');
      }
    }
    loadHosts();
  }, [selectedOrgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedOrgId) {
      setError('Please select an organization.');
      return;
    }

    if (!hostId) {
      setError('Please select a host employee. If none are available, contact the organization.');
      return;
    }

    if (!ndaChecked) {
      setError('You must read and agree to the Visitor NDA Agreement.');
      return;
    }

    if (!signatureText) {
      setError('Please sign the NDA by typing your full name.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        orgId: selectedOrgId,
        fullName,
        email,
        phone,
        company,
        purpose,
        hostEmployeeId: hostId,
        idType,
        scheduledDate,
        scheduledTime,
        photoBase64: photoData, // base64 representation of captured photo
        idDocumentBase64: '' // optional base64 document
      };

      await api.post('/visitors/register', payload);
      setRegisteredPhone(phone);
      setSuccess(true);
      
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container-fluid min-vh-100 p-0 d-flex flex-column align-items-center justify-content-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, #0a0b10 100%)' }}>
        <div className="w-100 px-3 text-center animate-slide-up" style={{ maxWidth: '500px' }}>
          <div className="glass-card p-5">
            <div className="bg-success bg-opacity-15 p-3 rounded-circle text-success mb-4 d-inline-block border border-success border-opacity-20" style={{ width: '80px', height: '80px' }}>
              <CheckCircle2 size={44} />
            </div>
            <h2 className="h3 fw-bold text-white mb-3">Request Submitted</h2>
            <p className="text-secondary mb-4 fs-6">
              Thank you, <strong>{fullName}</strong>. Your registration is complete and has been forwarded to your host for approval.
            </p>
            <div className="bg-dark bg-opacity-40 p-3 rounded-3 border mb-4 text-start" style={{ borderColor: 'var(--border-color)' }}>
              <span className="small text-muted d-block mb-1">Pass Status Tracking</span>
              <span className="text-white small d-block">
                You can track your approval status and download your digital entry badge by using your phone number: <strong>{registeredPhone}</strong>
              </span>
            </div>
            <div className="d-flex flex-column gap-2">
              <Link to={`/status?phone=${registeredPhone}`} className="btn btn-primary-custom py-2-5">
                Track Approval Status
              </Link>
              <Link to="/" className="btn btn-outline-secondary mt-2">
                Return to Landing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <span className="small text-secondary">Step 1 of 2: Visitor Information</span>
      </header>

      {/* Body Form */}
      <main className="flex-grow-1 container py-5" style={{ maxWidth: '1050px' }}>
        <div className="glass-card p-4 p-md-5 animate-slide-up">
          
          <div className="mb-4">
            <h2 className="h3 fw-bold text-white mb-2">Guest Check-In Registration</h2>
            <p className="text-secondary small">Please fill in your details to request entry approval from the host employee.</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              
              {/* Left Column: Form inputs */}
              <div className="col-md-7 d-flex flex-column gap-3">
                
                <div>
                  <label className="form-label small text-secondary">Full Name <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-custom ps-5"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6 mb-3 mb-sm-0">
                    <label className="form-label small text-secondary">Phone Number <span className="text-danger">*</span></label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        className="form-control form-control-custom ps-5"
                        placeholder="+1-555-0123"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-secondary">Email Address</label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control form-control-custom ps-5"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6 mb-3 mb-sm-0">
                    <label className="form-label small text-secondary">Company Name</label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Building size={16} />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-custom ps-5"
                        placeholder="Acme Corp"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-secondary">Purpose of Visit</label>
                    <select
                      className="form-select form-control-custom"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    >
                      <option value="Business Meeting">Business Meeting</option>
                      <option value="Job Interview">Job Interview</option>
                      <option value="Delivery / Vendor">Delivery / Vendor</option>
                      <option value="Facility Tour">Facility Tour</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-secondary">Organization to Visit <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-control-custom text-white"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select an Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-secondary">Host Employee to Meet <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-control-custom text-white"
                      value={hostId}
                      onChange={(e) => setHostId(e.target.value)}
                      required
                      disabled={!selectedOrgId || hosts.length === 0}
                    >
                      <option value="" disabled>
                        {!selectedOrgId ? 'Select organization first' : (hosts.length === 0 ? 'No employees available' : 'Select a host')}
                      </option>
                      {hosts.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.department} - {h.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6 mb-3 mb-sm-0">
                    <label className="form-label small text-secondary">Visit Date <span className="text-danger">*</span></label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Calendar size={16} />
                      </span>
                      <input
                        type="date"
                        className="form-control form-control-custom ps-5"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small text-secondary">Scheduled Time <span className="text-danger">*</span></label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Clock size={16} />
                      </span>
                      <input
                        type="time"
                        className="form-control form-control-custom ps-5"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label small text-secondary">Identity Verification ID <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                      <Landmark size={16} />
                    </span>
                    <select
                      className="form-select form-control-custom ps-5"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                    >
                      <option value="National ID">National ID Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver's License</option>
                      <option value="Company Badge">Other Company Badge</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Right Column: Webcam Verification */}
              <div className="col-md-5 d-flex flex-column align-items-center justify-content-start border-start" style={{ borderColor: 'var(--border-color)' }}>
                <span className="form-label small text-secondary w-100 text-center mb-3">Face Verification Photo</span>
                <WebcamCapture onCapture={(data) => setPhotoData(data)} />
                <p className="small text-muted text-center mt-3" style={{ maxWidth: '280px' }}>
                  Please sit upright and align your face in the camera stream for biometric entry logs.
                </p>
              </div>

            </div>

            {/* NDA Section */}
            <div className="mt-5 pt-4 border-top" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <BookOpen className="text-primary" size={20} />
                <h4 className="h5 fw-bold text-white m-0">Visitor NDA & Safety Policy</h4>
              </div>
              <div className="bg-dark bg-opacity-50 p-3 rounded-3 border mb-3 text-secondary" style={{ borderColor: 'var(--border-color)', maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                <p className="mb-2"><strong>1. Confidentiality:</strong> As a visitor, you may be exposed to proprietary company materials, products, designs, and business information. You agree to hold all such information in strict confidence and will not record, photo-capture, or disclose it to third parties.</p>
                <p className="mb-2"><strong>2. Safety Compliance:</strong> You must follow all workplace safety procedures, stay with your host escort at all times, and wear your visitor identification badge visible above the waist while on company property.</p>
                <p className="mb-0"><strong>3. Exit Protocol:</strong> You agree to return your issued visitor badge to the reception desk or gate security upon check-out and record your exit timestamp by scanning your badge QR code.</p>
              </div>
              
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="ndaCheck"
                  checked={ndaChecked}
                  onChange={(e) => setNdaChecked(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label small text-secondary" htmlFor="ndaCheck" style={{ cursor: 'pointer' }}>
                  I have read and agree to follow the terms of the Visitor NDA and Safety Policy.
                </label>
              </div>

              <div>
                <label className="form-label small text-secondary">Electronic Signature <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                    <FileCheck size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-custom ps-5"
                    placeholder="Type your full name to sign"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 mt-5 justify-content-end">
              <Link to="/" className="btn btn-outline-secondary px-4 py-2-5">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary-custom px-5 py-2-5 d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <span>Submit Pre-Registration</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>

    </div>
  );
}
