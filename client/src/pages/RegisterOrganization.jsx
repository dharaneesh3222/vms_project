import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orgName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register-organization', {
        orgName: formData.orgName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword
      });
      
      setSuccess('Organization registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to register organization');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-dark)' }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="glass-card p-5 animate-slide-up" style={{ borderRadius: '24px', border: '1px solid var(--border-color)' }}>
              
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-25 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                  <Building2 size={32} className="text-primary" />
                </div>
                <h2 className="text-white fw-bold mb-2">Register Organization</h2>
                <p className="text-secondary small">Set up your company's Visitor Management System and create the Master Admin account.</p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-4">
                  <ShieldCheck size={16} className="flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                {/* Organization Details */}
                <div>
                  <h6 className="text-white mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Company Details</h6>
                  <label className="form-label small text-secondary">Organization Name</label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                      <Building2 size={16} />
                    </span>
                    <input
                      type="text"
                      name="orgName"
                      className="form-control form-control-custom ps-5"
                      placeholder="Acme Corp"
                      value={formData.orgName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Admin Details */}
                <div className="mt-2">
                  <h6 className="text-white mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Master Admin Account</h6>
                  
                  <div className="mb-3">
                    <label className="form-label small text-secondary">Full Name</label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        name="adminName"
                        className="form-control form-control-custom ps-5"
                        placeholder="John Doe"
                        value={formData.adminName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">Email Address</label>
                    <div className="position-relative">
                      <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="adminEmail"
                        className="form-control form-control-custom ps-5"
                        placeholder="admin@acmecorp.com"
                        value={formData.adminEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Password</label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                          <Lock size={16} />
                        </span>
                        <input
                          type="password"
                          name="adminPassword"
                          className="form-control form-control-custom ps-5"
                          placeholder="••••••••"
                          value={formData.adminPassword}
                          onChange={handleChange}
                          required
                          minLength="6"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Confirm Password</label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                          <Lock size={16} />
                        </span>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control form-control-custom ps-5"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          minLength="6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-custom w-100 py-2-5 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    'Register Organization'
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="small text-secondary mb-0">
                  Already have an organization? <Link to="/login" className="text-primary text-decoration-none fw-semibold hover-opacity">Login here</Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
