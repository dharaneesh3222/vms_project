import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, X, Shield, Users, Clock, Calendar, CheckSquare, MessageSquare, RefreshCw, User, Briefcase, FileText, Hourglass, ShieldCheck, Activity, MapPin } from 'lucide-react';
import { api } from '../utils/api';

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [visits, setVisits] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [remarks, setRemarks] = useState({});
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const pendingData = await api.get('/employee/pending');
      const visitsData = await api.get('/employee/visits');
      try {
        const roomsData = await api.get('/employee/rooms');
        setRooms(roomsData || []);
      } catch (err) {
        // rooms fallback if empty
      }
      setPending(pendingData);
      setVisits(visitsData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('vms_user');
    const token = localStorage.getItem('vms_token');
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'employee' && parsedUser.role !== 'admin') {
        navigate('/login');
        return;
      }
      setUser(parsedUser);
      loadData();
    } catch (err) {
      localStorage.removeItem('vms_user');
      localStorage.removeItem('vms_token');
      navigate('/login');
    }
  }, [navigate]);

  const handleAction = async (visitId, action) => {
    setActionLoading(prev => ({ ...prev, [visitId]: true }));
    setError('');
    
    try {
      const path = `/employee/${action}/${visitId}`;
      const payload = { 
        remarks: remarks[visitId] || '',
        roomId: selectedRooms[visitId] || null
      };
      await api.post(path, payload);
      
      // Remove from pending locally and refresh
      setPending(prev => prev.filter(v => v.id !== visitId));
      loadData();
    } catch (err) {
      setError(err.message || `Failed to ${action} visit request.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [visitId]: false }));
    }
  };

  const handleRemarkChange = (visitId, val) => {
    setRemarks(prev => ({ ...prev, [visitId]: val }));
  };

  const handleLogout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="container-fluid min-vh-100 p-0 d-flex flex-column align-items-center justify-content-center" style={{ background: '#0a0b10', color: '#fff' }}>
        <div className="text-center p-4">
          <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="h6 text-light fw-medium mb-1">Loading Employee Portal...</h4>
          <p className="text-secondary small">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom px-4 py-3 sticky-top" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-success bg-opacity-25 p-2 rounded-3 border border-success border-opacity-50">
              <Shield className="text-success" size={20} />
            </div>
            <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              VMS<span className="text-success">.host</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <span className="d-block text-white small fw-semibold">{user.displayName}</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>{user.employeeDetails?.designation} · {user.employeeDetails?.department}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-2" style={{ borderRadius: '8px' }}>
              <LogOut size={14} /> <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow-1 container py-4 py-md-5">
        
        {/* Welcome Block */}
        <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <span className="badge bg-success bg-opacity-15 text-success mb-2 px-3 py-1 border border-success border-opacity-25" style={{ borderRadius: '20px' }}>
              Host Employee Portal
            </span>
            <h1 className="h2 fw-bold text-white m-0">Host Approval Dashboard</h1>
          </div>
          <button onClick={loadData} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 py-2 px-3" style={{ borderRadius: '8px' }}>
            <RefreshCw size={14} /> Refresh Dashboard
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="row g-4 mb-5">
          <div className="col-sm-6 col-md-4">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25">
                <Hourglass size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Pending Approvals</span>
                <span className="fs-4 fw-bold text-white">{pending.length}</span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-success bg-opacity-15 text-success border border-success border-opacity-25">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Approved Visits</span>
                <span className="fs-4 fw-bold text-white">
                  {visits.filter(v => v.status === 'Approved').length}
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="glass-card stat-card">
              <div className="stat-icon bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25">
                <Activity size={20} />
              </div>
              <div>
                <span className="d-block text-muted small">Active / Checked In</span>
                <span className="fs-4 fw-bold text-white">
                  {visits.filter(v => v.status === 'CheckedIn').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="row g-4">
          
          {/* Pending Requests Column */}
          <div className="col-lg-7">
            <div className="glass-card p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="h5 fw-bold m-0 text-white">Pending Requests ({pending.length})</h2>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status"></div>
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <User size={48} className="mb-2 text-muted" />
                  <p className="small">No pending visitor requests at the moment.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {pending.map((visit) => (
                    <div key={visit.id} className="p-4 rounded-4 border bg-dark bg-opacity-25 animate-fade-in position-relative overflow-hidden" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                      
                      {/* Left Accent Line */}
                      <div className="position-absolute top-0 start-0 h-100" style={{ width: '4px', backgroundColor: 'var(--employee-color)' }}></div>

                      <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-start mb-4 ps-2">
                        <div className="d-flex gap-3">
                          <div className="rounded-circle overflow-hidden bg-black flex-shrink-0 border border-secondary border-opacity-25" style={{ width: '56px', height: '56px' }}>
                            {visit.photoUrl ? (
                              <img src={visit.photoUrl} alt={visit.visitorName} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-dark">
                                <User size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="h6 fw-bold text-white mb-1">{visit.visitorName}</h3>
                            <span className="text-muted small d-block mb-2">{visit.visitorCompany || 'Private Visit'}</span>
                            <span className="badge bg-secondary fw-normal px-2 py-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                              {visit.visitorPhone}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-end small bg-dark bg-opacity-50 p-2 rounded-3 border border-secondary border-opacity-10">
                          <div className="text-white fw-semibold d-flex align-items-center gap-2 mb-1">
                            <Calendar size={12} style={{ color: 'var(--employee-color)' }} />
                            <span>{visit.scheduledDate}</span>
                          </div>
                          <div className="text-muted d-flex align-items-center gap-2 justify-content-end">
                            <Clock size={12} />
                            <span>{visit.scheduledTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="mb-4 bg-primary bg-opacity-10 p-3 rounded-3 border border-primary border-opacity-25 d-flex gap-2">
                        <div className="text-primary mt-1"><Briefcase size={16} /></div>
                        <div>
                          <span className="text-primary fw-semibold small d-block mb-1">Visit Purpose</span>
                          <span className="text-white small">{visit.purpose}</span>
                        </div>
                      </div>

                      {/* Meeting Room Allocation Selection */}
                      <div className="mb-3">
                        <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1.5 mb-1">
                          <MapPin size={14} className="text-primary" /> Allocate Meeting Room (Optional)
                        </label>
                        <select
                          className="form-select form-control-custom py-2 small text-white"
                          value={selectedRooms[visit.id] || ''}
                          onChange={(e) => setSelectedRooms(prev => ({ ...prev, [visit.id]: e.target.value }))}
                          style={{ fontSize: '13px' }}
                        >
                          <option value="">No Specific Room (Host Desk)</option>
                          {(Array.isArray(rooms) ? rooms : []).filter(r => r.isAvailable).map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name} (Capacity: {room.capacity} | Floor {room.floor || 1})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remarks Input */}
                      <div className="mb-4">
                        <div className="position-relative">
                          <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                            <MessageSquare size={16} />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-custom ps-5 py-2 small"
                            placeholder="Add approval remarks or instructions (optional)..."
                            value={remarks[visit.id] || ''}
                            onChange={(e) => handleRemarkChange(visit.id, e.target.value)}
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex justify-content-end gap-3 border-top pt-3" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          onClick={() => handleAction(visit.id, 'reject')}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 py-2 px-3 fw-medium"
                          disabled={actionLoading[visit.id]}
                          style={{ borderRadius: '8px' }}
                        >
                          <X size={16} /> Reject
                        </button>
                        <button
                          onClick={() => handleAction(visit.id, 'approve')}
                          className="btn btn-success btn-sm d-flex align-items-center gap-1.5 py-2 px-4 fw-medium text-white"
                          disabled={actionLoading[visit.id]}
                          style={{ borderRadius: '8px', backgroundColor: '#10b981', border: 'none' }}
                        >
                          <Check size={16} /> Approve Request
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Visit History Column */}
          <div className="col-lg-5">
            <div className="glass-card p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="h5 fw-bold m-0 text-white">Upcoming & Past Meetings</h2>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status"></div>
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <Calendar size={48} className="mb-2 text-muted" />
                  <p className="small">No meetings listed.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {visits.map((v) => (
                    <div key={v.id} className="d-flex justify-content-between align-items-center p-3 rounded bg-secondary bg-opacity-5 border border-light border-opacity-5">
                      <div className="d-flex gap-2.5 align-items-center">
                        <div className="small text-white">
                          <span className="d-block fw-semibold">{v.visitorName}</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>{v.visitorCompany || 'Private Visit'}</span>
                        </div>
                      </div>
                      <div className="text-end small">
                        <span className={`badge-custom rounded-pill py-0.5 px-2 ${
                          v.status === 'Approved' ? 'bg-success bg-opacity-20 text-success' :
                          v.status === 'CheckedIn' ? 'bg-primary bg-opacity-20 text-primary' :
                          v.status === 'CheckedOut' ? 'bg-secondary bg-opacity-20 text-muted' :
                          'bg-danger bg-opacity-20 text-danger'
                        }`} style={{ fontSize: '10px' }}>
                          {v.status === 'CheckedIn' ? 'Active' : v.status}
                        </span>
                        <span className="d-block text-muted mt-1" style={{ fontSize: '11px' }}>{v.scheduledDate} {v.scheduledTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
