import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Plus, Check, RefreshCw, Layers, Users, BookOpen, AlertCircle, MapPin, UserCheck, UserX, Camera, ClipboardCheck, Footprints, CalendarDays, BadgeCheck, DoorOpen } from 'lucide-react';
import { api } from '../utils/api';
import WebcamCapture from '../components/WebcamCapture';

export default function ReceptionistPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals / Form State
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [activeCheckinVisit, setActiveCheckinVisit] = useState(null);

  // Walkin Form Inputs
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [walkinCompany, setWalkinCompany] = useState('');
  const [walkinPurpose, setWalkinPurpose] = useState('Business Meeting');
  const [walkinHostId, setWalkinHostId] = useState('');
  const [walkinIdType, setWalkinIdType] = useState('National ID');
  const [walkinPhoto, setWalkinPhoto] = useState('');

  // Checkin Inputs
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const queueData = await api.get('/receptionist/queue');
      const roomsData = await api.get('/receptionist/rooms');
      const hostsData = await api.get('/visitors/hosts');
      setQueue(queueData);
      setRooms(roomsData);
      setHosts(hostsData);
      if (hostsData.length > 0 && !walkinHostId) {
        setWalkinHostId(hostsData[0].id);
      }
    } catch (err) {
      setError('Failed to load front-desk data. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('vms_user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'receptionist' && parsedUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    navigate('/login');
  };

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        fullName: walkinName,
        phone: walkinPhone,
        email: walkinEmail,
        company: walkinCompany,
        purpose: walkinPurpose,
        hostEmployeeId: walkinHostId,
        idType: walkinIdType,
        photoBase64: walkinPhoto
      };

      await api.post('/receptionist/walkin', payload);
      setSuccessMsg('Walk-in visitor registered and approved successfully!');
      setShowWalkinModal(false);
      
      // Reset inputs
      setWalkinName('');
      setWalkinPhone('');
      setWalkinEmail('');
      setWalkinCompany('');
      setWalkinPhoto('');
      
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to register walk-in visitor.');
    }
  };

  const openCheckin = (visit) => {
    setActiveCheckinVisit(visit);
    setBadgeNumber('');
    // Auto-select first available room or empty
    const available = rooms.filter(r => r.isAvailable);
    setSelectedRoomId(available.length > 0 ? available[0].id : '');
    setShowCheckinModal(true);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!badgeNumber) return;
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        roomId: selectedRoomId || null,
        badgeNumber
      };

      await api.post(`/receptionist/checkin/${activeCheckinVisit.id}`, payload);
      setSuccessMsg(`Visitor ${activeCheckinVisit.visitorName} checked in successfully. Badge issued.`);
      setShowCheckinModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to check-in visitor.');
    }
  };

  const handleCheckout = async (visitId, visitorName) => {
    setError('');
    setSuccessMsg('');
    try {
      // Reuses security guard checkout endpoint
      await api.post(`/security/confirm-checkout/${visitId}`);
      setSuccessMsg(`Visitor ${visitorName} checked out. Badge returned.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to check-out visitor.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Approved': return 'bg-success text-white';
      case 'CheckedIn': return 'bg-primary text-white';
      case 'CheckedOut': return 'bg-secondary text-white';
      case 'Rejected': return 'bg-danger text-white';
      default: return 'bg-dark text-white';
    }
  };

  if (!user) return null;

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom px-4 py-3 sticky-top" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-warning bg-opacity-25 p-2 rounded-3 border border-warning border-opacity-50">
              <Shield className="text-warning" size={20} />
            </div>
            <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              VMS<span className="text-warning">.frontdesk</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <span className="d-block text-white small fw-semibold">{user.displayName}</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Reception Management</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-2" style={{ borderRadius: '8px' }}>
              <LogOut size={14} /> <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 container py-5">
        
        {/* Welcome block */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <span className="badge bg-warning bg-opacity-15 text-warning mb-2 px-3 py-1 border border-warning border-opacity-25" style={{ borderRadius: '20px' }}>
              Front-Desk Operations
            </span>
            <h1 className="h2 fw-bold text-white m-0">Reception Queue & Registration</h1>
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => setShowWalkinModal(true)} className="btn btn-primary d-flex align-items-center gap-2 py-2 px-4" style={{ borderRadius: '8px', background: 'var(--receptionist-gradient)', border: 'none' }}>
              <Plus size={16} /> Register Walk-In
            </button>
            <button onClick={loadData} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 py-2 px-3" style={{ borderRadius: '8px' }}>
              <RefreshCw size={14} /> Refresh Queue
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4 animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-4 animate-fade-in">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats Summary */}
        <div className="row g-4 mb-5">
          <div className="col-sm-6 col-md-3">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25">
                <Footprints size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Walk-ins Today</span>
                <span className="fs-4 fw-bold text-white">
                  {queue.filter(v => v.purpose === 'Walk-in Meeting' || v.receptionistId).length}
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-info bg-opacity-15 text-info border border-info border-opacity-25">
                <CalendarDays size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Expected Guests</span>
                <span className="fs-4 fw-bold text-white">
                  {queue.filter(v => v.status === 'Approved').length}
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-success bg-opacity-15 text-success border border-success border-opacity-25">
                <BadgeCheck size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Checked In</span>
                <span className="fs-4 fw-bold text-white">
                  {queue.filter(v => v.status === 'CheckedIn').length}
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25">
                <DoorOpen size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Rooms Available</span>
                <span className="fs-4 fw-bold text-white">
                  {rooms.filter(r => r.isAvailable).length} / {rooms.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="glass-card p-4">
          <h2 className="h5 fw-bold mb-4 text-white">Today's Visitor Log</h2>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <Users size={48} className="mb-2 text-muted" />
              <p className="small">No visitor movements logged for today.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th scope="col" className="border-0 pb-3">Photo</th>
                    <th scope="col" className="border-0 pb-3">Visitor Info</th>
                    <th scope="col" className="border-0 pb-3">Host Escort</th>
                    <th scope="col" className="border-0 pb-3">Meeting Details</th>
                    <th scope="col" className="border-0 pb-3">Status</th>
                    <th scope="col" className="border-0 pb-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((visit) => (
                    <tr key={visit.id} style={{ borderColor: 'var(--border-color)' }}>
                      <td>
                        <div className="rounded-circle overflow-hidden bg-black border" style={{ width: '40px', height: '40px', borderColor: 'var(--border-color)' }}>
                          {visit.visitorPhoto ? (
                            <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-dark">
                              <Users size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="d-block fw-semibold text-white">{visit.visitorName}</span>
                        <span className="text-muted small d-block">{visit.visitorCompany || 'N/A'} · {visit.visitorPhone}</span>
                      </td>
                      <td>
                        <span className="d-block text-white small fw-medium">{visit.hostName}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>{visit.hostDepartment}</span>
                      </td>
                      <td>
                        <span className="d-block text-white small">{visit.purpose}</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                          {visit.meetingRoomName ? `Room: ${visit.meetingRoomName}` : 'Desk / Area'}
                          {visit.badgeNumber && ` · Badge: ${visit.badgeNumber}`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-custom rounded-pill py-1 px-2.5 ${getStatusBadge(visit.status)}`} style={{ fontSize: '11px' }}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {visit.status === 'Approved' && (
                          <button
                            onClick={() => openCheckin(visit)}
                            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 py-1.5 px-3 text-white"
                            style={{ borderRadius: '6px' }}
                          >
                            <UserCheck size={14} /> Check In
                          </button>
                        )}
                        {visit.status === 'CheckedIn' && (
                          <button
                            onClick={() => handleCheckout(visit.id, visit.visitorName)}
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1.5 px-3"
                            style={{ borderRadius: '6px' }}
                          >
                            <UserX size={14} /> Check Out
                          </button>
                        )}
                        {visit.status === 'Pending' && (
                          <span className="text-muted small">Awaiting Host Approval</span>
                        )}
                        {(visit.status === 'CheckedOut' || visit.status === 'Rejected') && (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* WALK-IN MODAL */}
      {showWalkinModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">Register Walk-In Visitor</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowWalkinModal(false)}></button>
              </div>
              <form onSubmit={handleWalkinSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    
                    <div className="col-md-7 d-flex flex-column gap-3">
                      <div>
                        <label className="form-label small text-secondary">Full Name</label>
                        <input type="text" className="form-control form-control-custom" placeholder="Guest Name" value={walkinName} onChange={e => setWalkinName(e.target.value)} required />
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <label className="form-label small text-secondary">Phone Number</label>
                          <input type="tel" className="form-control form-control-custom" placeholder="Phone" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} required />
                        </div>
                        <div className="col-6">
                          <label className="form-label small text-secondary">Email Address</label>
                          <input type="email" className="form-control form-control-custom" placeholder="Email" value={walkinEmail} onChange={e => setWalkinEmail(e.target.value)} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <label className="form-label small text-secondary">Company Name</label>
                          <input type="text" className="form-control form-control-custom" placeholder="Company" value={walkinCompany} onChange={e => setWalkinCompany(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small text-secondary">Purpose of Visit</label>
                          <select className="form-select form-control-custom" value={walkinPurpose} onChange={e => setWalkinPurpose(e.target.value)}>
                            <option value="Business Meeting">Business Meeting</option>
                            <option value="Job Interview">Job Interview</option>
                            <option value="Delivery / Vendor">Delivery / Vendor</option>
                            <option value="Facility Tour">Facility Tour</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label small text-secondary">Host Employee Escort</label>
                        <select className="form-select form-control-custom" value={walkinHostId} onChange={e => setWalkinHostId(e.target.value)} required>
                          {hosts.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.department})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label small text-secondary">Identity Verification ID</label>
                        <select className="form-select form-control-custom" value={walkinIdType} onChange={e => setWalkinIdType(e.target.value)}>
                          <option value="National ID">National ID Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driver License">Driver's License</option>
                          <option value="Company Badge">Other Company Badge</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-5 d-flex flex-column align-items-center justify-content-start border-start" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="form-label small text-secondary w-100 text-center mb-3">Biometric Face Snapshot</span>
                      <WebcamCapture onCapture={(data) => setWalkinPhoto(data)} />
                    </div>

                  </div>
                </div>
                <div className="modal-footer border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowWalkinModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--receptionist-gradient)', border: 'none' }}>Register & Pre-Approve</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {showCheckinModal && activeCheckinVisit && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">Check-In: {activeCheckinVisit.visitorName}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCheckinModal(false)}></button>
              </div>
              <form onSubmit={handleCheckinSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  
                  <div>
                    <span className="small text-muted d-block mb-1">Visitor</span>
                    <span className="text-white fw-semibold d-block">{activeCheckinVisit.visitorName} ({activeCheckinVisit.visitorCompany || 'N/A'})</span>
                  </div>

                  <div>
                    <span className="small text-muted d-block mb-1">Host Host Escort</span>
                    <span className="text-white small d-block">{activeCheckinVisit.hostName} ({activeCheckinVisit.hostDepartment})</span>
                  </div>

                  <div>
                    <label className="form-label small text-secondary">Allocate Meeting Room (Optional)</label>
                    <select className="form-select form-control-custom text-white" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
                      <option value="">No Room (Direct to Host Desk)</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id} disabled={!r.isAvailable}>
                          {r.name} (Floor {r.floor} · Cap {r.capacity}) {!r.isAvailable && '— Occupied'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label small text-secondary">Issue Physical Badge Number <span className="text-danger">*</span></label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <MapPin size={16} />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-custom ps-5"
                        placeholder="e.g. B-102"
                        value={badgeNumber}
                        onChange={e => setBadgeNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                </div>
                <div className="modal-footer border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckinModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success text-white">Confirm Entry & Issue Badge</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
