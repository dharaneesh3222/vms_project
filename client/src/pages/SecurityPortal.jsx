import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Scan, List, History, Search, Check, AlertTriangle, Key, Clock, Users, ArrowRightLeft, ArrowRight, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../utils/api';
import confetti from 'canvas-confetti';

export default function SecurityPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner', 'live', 'logs'
  
  // Lists Data
  const [liveVisitors, setLiveVisitors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Scanner States
  const [manualId, setManualId] = useState('');
  const [scannedVisit, setScannedVisit] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [gateBadge, setGateBadge] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const scannerRef = useRef(null);

  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      if (activeTab === 'live') {
        const data = await api.get('/security/live');
        setLiveVisitors(data);
      } else if (activeTab === 'logs') {
        const data = await api.get('/security/logs');
        setLogs(data);
      }
    } catch (err) {
      setError('Failed to load security lists.');
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
    if (parsedUser.role !== 'security' && parsedUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
    
    if (activeTab !== 'scanner') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [navigate, activeTab]);

  // QR Code Scanner Activation
  useEffect(() => {
    if (activeTab === 'scanner' && cameraActive) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          html5QrcodeScanner.clear();
          setCameraActive(false);
          handleScanLookup(decodedText);
        },
        (err) => {
          // Keep scanning...
        }
      );

      scannerRef.current = html5QrcodeScanner;

      return () => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch (e) {
            // Ignored
          }
        }
      };
    }
  }, [activeTab, cameraActive]);

  const handleScanLookup = async (visitId) => {
    setError('');
    setScannedVisit(null);
    setScanLoading(true);
    setGateBadge('');

    try {
      const data = await api.post('/security/scan', { qrData: visitId });
      setScannedVisit(data);
    } catch (err) {
      setError(err.message || 'QR code lookup failed. Pass may be invalid.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId) {
      handleScanLookup(manualId.trim());
    }
  };

  const handleConfirmCheckin = async () => {
    if (!scannedVisit) return;
    setError('');
    setSuccessMsg('');

    try {
      await api.post(`/security/confirm-checkin/${scannedVisit.id}`, { badgeNumber: gateBadge || 'GATE_PASS' });
      setSuccessMsg(`Gate Entry Confirmed for ${scannedVisit.visitorName}. Checked-In successfully.`);
      
      // Celebrate
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      setScannedVisit(null);
      setManualId('');
    } catch (err) {
      setError(err.message || 'Failed to confirm check-in at gate.');
    }
  };

  const handleConfirmCheckout = async (visitId, visitorName) => {
    setError('');
    setSuccessMsg('');

    try {
      const vid = visitId || scannedVisit.id;
      const vname = visitorName || scannedVisit.visitorName;
      
      await api.post(`/security/confirm-checkout/${vid}`);
      setSuccessMsg(`Gate Exit Confirmed for ${vname}. Checked-Out successfully.`);
      
      // Celebrate
      confetti({ particleCount: 50, colors: ['#ff0000', '#ffffff'] });

      if (scannedVisit && scannedVisit.id === vid) {
        setScannedVisit(null);
        setManualId('');
      }
      if (activeTab === 'live') {
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm check-out at gate.');
    }
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
          <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="h6 text-light fw-medium mb-1">Loading Security Gate Portal...</h4>
          <p className="text-secondary small">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom px-4 py-3 sticky-top" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-danger bg-opacity-25 p-2 rounded-3 border border-danger border-opacity-50">
              <Shield className="text-danger" size={20} />
            </div>
            <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              VMS<span className="text-danger">.gatehouse</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <span className="d-block text-white small fw-semibold">{user.displayName}</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Gatehouse Security</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-2" style={{ borderRadius: '8px' }}>
              <LogOut size={14} /> <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow-1 container py-5">
        
        {/* Title */}
        <div className="mb-4">
          <span className="badge bg-danger bg-opacity-15 text-danger mb-2 px-3 py-1 border border-danger border-opacity-25" style={{ borderRadius: '20px' }}>
            Checkpoint Control
          </span>
          <h1 className="h2 fw-bold text-white m-0">Security Checkpoint Dashboard</h1>
        </div>

        {/* Tab Selection */}
        <div className="d-flex gap-2 mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <button 
            className={`btn btn-sm d-flex align-items-center gap-1.5 py-2 px-3 ${activeTab === 'scanner' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '8px' }}
            onClick={() => setActiveTab('scanner')}
          >
            <Scan size={14} /> Checkpoint Scanner
          </button>
          <button 
            className={`btn btn-sm d-flex align-items-center gap-1.5 py-2 px-3 ${activeTab === 'live' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '8px' }}
            onClick={() => setActiveTab('live')}
          >
            <Users size={14} /> Live On-Site
          </button>
          <button 
            className={`btn btn-sm d-flex align-items-center gap-1.5 py-2 px-3 ${activeTab === 'logs' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '8px' }}
            onClick={() => setActiveTab('logs')}
          >
            <History size={14} /> Checkpoint Logs
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4 animate-fade-in">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-4 animate-fade-in">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==========================================
            TAB: SCANNER
            ========================================== */}
        {activeTab === 'scanner' && (
          <div className="row g-4">
            
            {/* Scan Viewport Column */}
            <div className="col-lg-6">
              <div className="glass-card p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                <h3 className="h5 fw-bold text-white mb-3">Scan Entry QR Pass</h3>
                
                {cameraActive ? (
                  <div className="position-relative w-100 rounded-3 overflow-hidden bg-black border border-danger border-opacity-35" style={{ maxWidth: '350px', aspectRatio: '1/1' }}>
                    <div className="scanner-line"></div>
                    <div id="reader" style={{ width: '100%' }}></div>
                  </div>
                ) : (
                  <div className="border border-2 dashed rounded-3 d-flex flex-column align-items-center justify-content-center text-muted mb-3" style={{ width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderColor: 'var(--border-color)' }}>
                    <Scan size={48} className="mb-2 text-danger opacity-50" />
                    <span className="small">Camera Scanner Standby</span>
                  </div>
                )}

                <div className="mt-3 d-flex gap-2">
                  {cameraActive ? (
                    <button onClick={() => setCameraActive(false)} className="btn btn-outline-secondary btn-sm">
                      Cancel Camera Scan
                    </button>
                  ) : (
                    <button onClick={() => setCameraActive(true)} className="btn btn-danger btn-sm px-4">
                      Activate Web Camera
                    </button>
                  )}
                </div>

                <div className="w-100 border-top mt-4 pt-4 text-start" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="small text-secondary d-block mb-2">Sandbox Manual Code Input fallback:</span>
                  <form onSubmit={handleManualSubmit} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-custom py-2 small"
                      placeholder="Paste Visit ID here (e.g. vis...)"
                      value={manualId}
                      onChange={e => setManualId(e.target.value)}
                    />
                    <button type="submit" className="btn btn-outline-danger btn-sm px-3" disabled={scanLoading}>
                      Query ID
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Scan Results Column */}
            <div className="col-lg-6">
              <div className="glass-card p-4 h-100">
                <h3 className="h5 fw-bold text-white mb-4 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}>Scan Lookup details</h3>

                {scanLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                  </div>
                ) : !scannedVisit ? (
                  <div className="text-center py-5 text-secondary h-100 d-flex flex-column align-items-center justify-content-center">
                    <Key size={48} className="mb-2 text-muted" />
                    <p className="small">Please scan a visitor QR badge or input their Visit ID manually to verify credentials.</p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    
                    {/* Visitor Card */}
                    <div className="p-3 rounded bg-dark bg-opacity-30 border border-light border-opacity-5 mb-4">
                      <div className="d-flex gap-3 align-items-start mb-3">
                        <div className="rounded overflow-hidden bg-black border" style={{ width: '64px', height: '64px' }}>
                          {scannedVisit.photoUrl ? (
                            <img src={scannedVisit.photoUrl} alt={scannedVisit.visitorName} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-dark">
                              <Users size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="h6 fw-bold text-white m-0">{scannedVisit.visitorName}</h4>
                          <span className="small text-muted d-block">{scannedVisit.visitorCompany || 'Private Visit'}</span>
                          <span className="small text-muted d-block">{scannedVisit.visitorPhone}</span>
                        </div>
                      </div>

                      <div className="row g-2 small border-top pt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="col-6">
                          <span className="text-muted d-block">Host:</span>
                          <span className="text-white fw-medium">{scannedVisit.hostName}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Scheduled:</span>
                          <span className="text-white fw-medium">{scannedVisit.scheduledDate} {scannedVisit.scheduledTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4 d-flex justify-content-between align-items-center p-2.5 rounded bg-secondary bg-opacity-10">
                      <span className="small text-secondary">Pass Status:</span>
                      <span className={`badge-custom rounded-pill py-0.5 px-3 ${
                        scannedVisit.status === 'Approved' ? 'bg-success text-white' :
                        scannedVisit.status === 'CheckedIn' ? 'bg-primary text-white' :
                        scannedVisit.status === 'CheckedOut' ? 'bg-secondary text-muted' :
                        'bg-danger text-white'
                      }`} style={{ fontSize: '12px' }}>
                        {scannedVisit.status}
                      </span>
                    </div>

                    {/* Action Block */}
                    {scannedVisit.status === 'Approved' && (
                      <div className="d-flex flex-column gap-3 border-top pt-3" style={{ borderColor: 'var(--border-color)' }}>
                        <div>
                          <label className="form-label small text-secondary">Assign Gate Badge ID (Optional)</label>
                          <input
                            type="text"
                            className="form-control form-control-custom py-2"
                            placeholder="e.g. GATE_PASS_12"
                            value={gateBadge}
                            onChange={e => setGateBadge(e.target.value)}
                          />
                        </div>
                        <button onClick={handleConfirmCheckin} className="btn btn-success text-white w-100 py-2-5 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '10px' }}>
                          <UserCheck size={16} /> Confirm Entry & Check-In
                        </button>
                      </div>
                    )}

                    {scannedVisit.status === 'CheckedIn' && (
                      <div className="border-top pt-3" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="alert alert-info py-2 px-3 small mb-3">
                          Visitor is currently inside the facility (Badge: {scannedVisit.badgeNumber}).
                        </div>
                        <button onClick={() => handleConfirmCheckout(scannedVisit.id, scannedVisit.visitorName)} className="btn btn-danger text-white w-100 py-2-5 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '10px' }}>
                          <UserX size={16} /> Confirm Exit & Check-Out
                        </button>
                      </div>
                    )}

                    {(scannedVisit.status === 'CheckedOut' || scannedVisit.status === 'Rejected' || scannedVisit.status === 'Pending') && (
                      <div className="alert alert-warning m-0 small py-2 px-3 border border-warning border-opacity-15">
                        {scannedVisit.status === 'CheckedOut' && 'This QR pass has already expired (visit completed).'}
                        {scannedVisit.status === 'Rejected' && 'Access Denied: Visitor request was rejected by host.'}
                        {scannedVisit.status === 'Pending' && 'Access Denied: Visitor request is still awaiting host employee approval.'}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: LIVE ON-SITE
            ========================================== */}
        {activeTab === 'live' && (
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="h5 fw-bold m-0 text-white">Live On-Site Visitors ({liveVisitors.length})</h2>
              <button onClick={loadData} className="btn btn-outline-secondary btn-sm"><RefreshCw size={12} /></button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
              </div>
            ) : liveVisitors.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <Users size={48} className="mb-2 text-muted" />
                <p className="small">No active visitors checked-in on premises.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)' }}>
                      <th>Photo</th>
                      <th>Visitor Name</th>
                      <th>Host Escort</th>
                      <th>Badge ID</th>
                      <th>Check-in Time</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveVisitors.map(v => (
                      <tr key={v.id} style={{ borderColor: 'var(--border-color)' }}>
                        <td>
                          <div className="rounded-circle overflow-hidden bg-black border" style={{ width: '36px', height: '36px' }}>
                            {v.photoUrl ? (
                              <img src={v.photoUrl} alt={v.visitorName} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-dark"><Users size={14} /></div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-white fw-semibold d-block">{v.visitorName}</span>
                          <span className="small text-muted">{v.visitorCompany}</span>
                        </td>
                        <td>{v.hostName}</td>
                        <td><span className="badge bg-secondary bg-opacity-20 text-muted">{v.badgeNumber || 'N/A'}</span></td>
                        <td>{new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-end">
                          <button onClick={() => handleConfirmCheckout(v.id, v.visitorName)} className="btn btn-sm btn-outline-danger">
                            Check-Out Exit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB: LOGS
            ========================================== */}
        {activeTab === 'logs' && (
          <div className="glass-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="h5 fw-bold m-0 text-white">Security Checkpoint Activity Trail</h2>
              <button onClick={loadData} className="btn btn-outline-secondary btn-sm"><RefreshCw size={12} /></button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <History size={48} className="mb-2 text-muted" />
                <p className="small">No logs recorded.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)' }}>
                      <th>Timestamp</th>
                      <th>Officer/Actor</th>
                      <th>Visitor Involved</th>
                      <th>Action</th>
                      <th>Activity Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderColor: 'var(--border-color)' }}>
                        <td className="small text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="small text-white fw-semibold">{log.actorName}</td>
                        <td className="small text-white">{log.visitorName}</td>
                        <td>
                          <span className={`badge-custom rounded-pill py-0.5 px-2 ${
                            log.action.includes('SUCCESS') || log.action.includes('CHECK_IN') ? 'bg-success bg-opacity-20 text-success' :
                            log.action.includes('FAILED') || log.action.includes('BLOCKED') || log.action.includes('REJECTED') ? 'bg-danger bg-opacity-20 text-danger' :
                            'bg-primary bg-opacity-20 text-primary'
                          }`} style={{ fontSize: '10px' }}>
                            {log.action}
                          </span>
                        </td>
                        <td className="small text-muted" style={{ fontSize: '12px' }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
