import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, AlertCircle, Sparkles, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api, BASE_URL } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (searchParams.get('expired')) {
      setInfoMsg('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('vms_token', data.token);
      localStorage.setItem('vms_user', JSON.stringify(data.user));
      
      // Dispatch custom storage event to update layouts
      window.dispatchEvent(new Event('storage'));

      // Redirect based on role
      const role = data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'receptionist') navigate('/receptionist');
      else if (role === 'security') navigate('/security');
      else if (role === 'employee') navigate('/employee');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column align-items-center justify-content-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, #0a0b10 100%)' }}>
      
      <div className="w-100 px-3 position-relative" style={{ maxWidth: '850px' }}>
        
        {/* Back Button */}
        <Link to="/" className="position-absolute text-secondary text-decoration-none d-flex align-items-center gap-1 small hover-text-white" style={{ top: '-40px', left: '15px', transition: 'color 0.2s' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Logo */}
        <div className="text-center mb-5">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
            <div className="bg-primary bg-opacity-25 p-2 rounded-3 border border-primary border-opacity-50">
              <Shield className="text-primary" size={24} />
            </div>
            <span className="fs-3 fw-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              VMS<span className="text-primary">.io</span>
            </span>
          </Link>
        </div>

        <div className="row g-4 justify-content-center align-items-stretch">
          
          <div className="col-lg-6 col-md-10">
            {/* Login Form Card */}
            <div className="glass-card p-4 animate-slide-up h-100">
              <h2 className="h4 fw-bold text-center mb-1 text-white">Staff Authentication</h2>
              <p className="small text-secondary text-center mb-0">Access your department portal</p>
              <p className="small text-center mb-4" style={{ color: '#ff6b6b', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                DEBUG URL: {BASE_URL}
              </p>

              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {infoMsg && (
                <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
                {selectedRole && (
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    <Shield size={16} className="flex-shrink-0" />
                    <span>Selected Role: <strong>{selectedRole}</strong></span>
                  </div>
                )}
                
                <div>
                  <label className="form-label small text-secondary">Email Address</label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-custom ps-5"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small text-secondary">Password</label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control form-control-custom ps-5 pe-5"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-1 text-secondary border-0 p-2 shadow-none"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2 py-2-5 mt-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Authenticate</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="small text-secondary mb-0">
                  Are you a new company? <Link to="/register" className="text-primary text-decoration-none fw-semibold hover-opacity">Register your Organization</Link>
                </p>
              </div>

            </div>
          </div>

          <div className="col-lg-6 col-md-10">
            {/* Demo Roles Credentials manual info */}
            <div className="glass-card p-4 animate-slide-up h-100 d-flex flex-column justify-content-center" style={{ animationDelay: '0.1s' }}>
              <div className="d-flex align-items-center gap-1.5 mb-2 text-primary">
                <Sparkles size={16} />
                <span className="small fw-semibold">Sandbox Demo Accounts</span>
              </div>
              <p className="small text-secondary mb-4">Click a role to select it, then manually enter your ID and password below:</p>
              
              <div className="row g-3">
                <div className="col-6">
                  <button onClick={() => setSelectedRole('System Admin')} type="button" className="demo-role-btn w-100 text-start py-2 px-3 small d-flex flex-column h-100 bg-transparent" style={{ border: selectedRole === 'System Admin' ? '2px solid var(--admin-color)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: selectedRole === 'System Admin' ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }}>
                    <span className="fw-semibold text-white mb-1" style={{ fontSize: '13px' }}>System Admin</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Full controls</span>
                  </button>
                </div>
                <div className="col-6">
                  <button onClick={() => setSelectedRole('Receptionist')} type="button" className="demo-role-btn w-100 text-start py-2 px-3 small d-flex flex-column h-100 bg-transparent" style={{ border: selectedRole === 'Receptionist' ? '2px solid var(--receptionist-color)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: selectedRole === 'Receptionist' ? 'rgba(249, 115, 22, 0.1)' : 'transparent' }}>
                    <span className="fw-semibold text-white mb-1" style={{ fontSize: '13px' }}>Receptionist</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Walk-ins & badges</span>
                  </button>
                </div>
                <div className="col-6">
                  <button onClick={() => setSelectedRole('Security Guard')} type="button" className="demo-role-btn w-100 text-start py-2 px-3 small d-flex flex-column h-100 bg-transparent" style={{ border: selectedRole === 'Security Guard' ? '2px solid var(--security-color)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: selectedRole === 'Security Guard' ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <span className="fw-semibold text-white mb-1" style={{ fontSize: '13px' }}>Security Guard</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>QR scan check-in</span>
                  </button>
                </div>
                <div className="col-6">
                  <button onClick={() => setSelectedRole('Host Employee')} type="button" className="demo-role-btn w-100 text-start py-2 px-3 small d-flex flex-column h-100 bg-transparent" style={{ border: selectedRole === 'Host Employee' ? '2px solid var(--employee-color)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: selectedRole === 'Host Employee' ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}>
                    <span className="fw-semibold text-white mb-1" style={{ fontSize: '13px' }}>Host Employee</span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Approvals / agenda</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
