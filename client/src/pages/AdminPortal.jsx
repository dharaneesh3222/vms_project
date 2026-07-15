import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Shield, LayoutDashboard, Users, Layers, Settings, History, 
  Plus, Edit, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Save, 
  Activity, Mail, ShieldAlert, Key, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../utils/api';

// Register Chart.js elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdminPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, employees, rooms, settings, logs

  // Data States
  const [analytics, setAnalytics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals / Form States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ id: '', name: '', email: '', department: '', designation: '', officeLocation: '', phoneNumber: '', password: '' });
  
  const [showSystemUserModal, setShowSystemUserModal] = useState(false);
  const [systemUserForm, setSystemUserForm] = useState({ id: '', name: '', email: '', role: 'admin', password: '' });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ id: '', name: '', newPassword: '' });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ id: '', name: '', floor: '', capacity: 4, isAvailable: true });

  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await api.get('/admin/analytics');
        setAnalytics(data);
      } else if (activeTab === 'employees') {
        const data = await api.get('/admin/employees');
        setEmployees(data);
      } else if (activeTab === 'system-users') {
        const data = await api.get('/admin/system-users');
        setSystemUsers(data);
      } else if (activeTab === 'rooms') {
        const data = await api.get('/admin/rooms');
        setRooms(data);
      } else if (activeTab === 'settings') {
        const data = await api.get('/admin/settings');
        setSettings(data);
      } else if (activeTab === 'logs') {
        const data = await api.get('/security/logs'); // reuse security logs endpoint
        setLogs(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch administration data.');
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
    if (parsedUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    navigate('/login');
  };

  // ==========================================
  // EMPLOYEE ACTIONS
  // ==========================================
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (employeeForm.id) {
        // Edit mode
        await api.put(`/admin/employees/${employeeForm.id}`, employeeForm);
        setSuccess('Employee details updated successfully.');
      } else {
        // Create mode
        await api.post('/admin/employees', employeeForm);
        setSuccess('New employee profile added successfully.');
      }
      setShowEmployeeModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit employee data.');
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to toggle active status of this employee?')) return;
    setError('');
    setSuccess('');
    try {
      const data = await api.delete(`/admin/employees/${id}`);
      setSuccess(data.message || 'Employee status toggled.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to toggle employee status.');
    }
  };

  const openAddEmployee = () => {
    setEmployeeForm({ id: '', name: '', email: '', department: 'Engineering', designation: '', officeLocation: '', phoneNumber: '', password: '' });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp) => {
    setEmployeeForm({ 
      id: emp.id, 
      name: emp.name, 
      email: emp.email, 
      department: emp.department, 
      designation: emp.designation, 
      officeLocation: emp.officeLocation || '', 
      phoneNumber: emp.phoneNumber || '',
      password: 'dummyPassword123'
    });
    setShowEmployeeModal(true);
  };

  const deleteEmployeePermanent = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this employee? This action cannot be undone.')) return;
    setError('');
    setSuccess('');
    try {
      const data = await api.delete(`/admin/employees/${id}/permanent`);
      setSuccess(data.message || 'Employee permanently deleted.');
      setShowEmployeeModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to permanently delete employee.');
    }
  };

  // ==========================================
  // SYSTEM USERS ACTIONS
  // ==========================================
  const handleSystemUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (systemUserForm.id) {
        await api.put(`/admin/system-users/${systemUserForm.id}`, systemUserForm);
        setSuccess('System user updated successfully.');
      } else {
        await api.post('/admin/system-users', systemUserForm);
        setSuccess('New system user created successfully.');
      }
      setShowSystemUserModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save system user.');
    }
  };

  const deleteSystemUser = async (id) => {
    if (!window.confirm('Are you sure you want to toggle active status of this user?')) return;
    setError('');
    setSuccess('');
    try {
      const data = await api.delete(`/admin/system-users/${id}`);
      setSuccess(data.message || 'User status toggled.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to toggle user status.');
    }
  };

  const deleteSystemUserPermanent = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this system user? This action cannot be undone.')) return;
    setError('');
    setSuccess('');
    try {
      const data = await api.delete(`/admin/system-users/${id}/permanent`);
      setSuccess(data.message || 'User permanently deleted.');
      setShowSystemUserModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to permanently delete system user.');
    }
  };

  const openAddSystemUser = () => {
    setSystemUserForm({ id: '', name: '', email: '', role: 'admin', password: '' });
    setShowSystemUserModal(true);
  };

  const openEditSystemUser = (u) => {
    setSystemUserForm({ id: u.id, name: u.displayName, email: u.email, role: u.role, password: '' });
    setShowSystemUserModal(true);
  };

  const openChangePassword = (emp) => {
    setPasswordForm({ id: emp.id, name: emp.name, newPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/employees/${passwordForm.id}/password`, { newPassword: passwordForm.newPassword });
      setSuccess(`Password updated successfully for ${passwordForm.name}`);
      setShowPasswordModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    }
  };

  // ==========================================
  // ROOM ACTIONS
  // ==========================================
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (roomForm.id) {
        await api.put(`/admin/rooms/${roomForm.id}`, roomForm);
        setSuccess('Meeting room updated successfully.');
      } else {
        await api.post('/admin/rooms', roomForm);
        setSuccess('Meeting room added successfully.');
      }
      setShowRoomModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit room details.');
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm('Delete this meeting room?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/rooms/${id}`);
      setSuccess('Meeting room deleted.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete room.');
    }
  };

  const openAddRoom = () => {
    setRoomForm({ id: '', name: '', floor: '', capacity: 4, isAvailable: true });
    setShowRoomModal(true);
  };

  const openEditRoom = (room) => {
    setRoomForm(room);
    setShowRoomModal(true);
  };

  // ==========================================
  // SETTINGS ACTIONS
  // ==========================================
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/settings', settings);
      setSuccess('Global system configuration updated successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    }
  };

  const handleSettingChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  // ==========================================
  // CHART STYLING OPTIONS
  // ==========================================
  const lineChartData = analytics ? {
    labels: analytics.charts.daily.labels,
    datasets: [{
      label: 'Visitor Volume',
      data: analytics.charts.daily.data,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.3,
      fill: true,
    }]
  } : null;

  const barChartData = analytics ? {
    labels: analytics.charts.department.labels,
    datasets: [{
      label: 'Visits by Host Department',
      data: analytics.charts.department.data,
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  } : null;

  const doughnutData = analytics ? {
    labels: analytics.charts.purpose.labels,
    datasets: [{
      label: 'Purpose of Visit',
      data: analytics.charts.purpose.data,
      backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6'],
      borderWidth: 0
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af' } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
    }
  };

  if (!user) return null;

  return (
    <div className="container-fluid min-vh-100 p-0 d-flex flex-column" style={{ background: '#0a0b10' }}>
      
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom px-4 py-3 sticky-top" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(10px)' }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-25 p-2 rounded-3 border border-primary border-opacity-50">
              <Shield className="text-primary" size={20} />
            </div>
            <span className="fs-5 fw-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              VMS<span className="text-primary">.admin</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <span className="d-block text-white small fw-semibold">{user.displayName}</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Global Administrator</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-2" style={{ borderRadius: '8px' }}>
              <LogOut size={14} /> <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Layout */}
      <div className="sidebar-layout flex-grow-1">
        
        {/* Sidebar Nav */}
        <aside className="sidebar-nav no-print p-3">
          <Link to="#" onClick={() => setActiveTab('dashboard')} className={`sidebar-item ${activeTab === 'dashboard' ? 'active admin-active' : ''}`}>
            <LayoutDashboard size={18} /> <span>Analytics Panel</span>
          </Link>
          <Link to="#" onClick={() => setActiveTab('employees')} className={`sidebar-item ${activeTab === 'employees' ? 'active admin-active' : ''}`}>
            <Users size={18} /> <span>Staff Directory</span>
          </Link>
          <Link to="#" onClick={() => setActiveTab('system-users')} className={`sidebar-item ${activeTab === 'system-users' ? 'active admin-active' : ''}`}>
            <ShieldAlert size={18} /> <span>System Users</span>
          </Link>
          <Link to="#" onClick={() => setActiveTab('rooms')} className={`sidebar-item ${activeTab === 'rooms' ? 'active admin-active' : ''}`}>
            <Layers size={18} /> <span>Meeting Rooms</span>
          </Link>
          <Link to="#" onClick={() => setActiveTab('settings')} className={`sidebar-item ${activeTab === 'settings' ? 'active admin-active' : ''}`}>
            <Settings size={18} /> <span>System Config</span>
          </Link>
          <Link to="#" onClick={() => setActiveTab('logs')} className={`sidebar-item ${activeTab === 'logs' ? 'active admin-active' : ''}`}>
            <History size={18} /> <span>System Logs</span>
          </Link>
        </aside>

        {/* Content Area */}
        <section className="sidebar-content">
          
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="h4 fw-bold text-white capitalize m-0">{activeTab} Controls</h2>
            <button onClick={loadData} className="btn btn-outline-secondary btn-sm py-1.5 px-2.5" style={{ borderRadius: '8px' }}>
              <RefreshCw size={12} />
            </button>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* ==========================================
              TAB: DASHBOARD
              ========================================== */}
          {activeTab === 'dashboard' && analytics && (
            <div className="animate-fade-in">
              
              {/* Stats Grid */}
              <div className="row g-3 mb-5">
                <div className="col-6 col-md-3">
                  <div className="glass-card p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25" style={{ width: '44px', height: '44px' }}><Activity size={18} /></div>
                    <div><span className="small text-muted d-block" style={{ fontSize: '12px' }}>Total Visits</span><span className="fs-5 fw-bold text-white">{analytics.summary.totalVisits}</span></div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25" style={{ width: '44px', height: '44px' }}><History size={18} /></div>
                    <div><span className="small text-muted d-block" style={{ fontSize: '12px' }}>Expected Today</span><span className="fs-5 fw-bold text-white">{analytics.summary.todaysVisitors}</span></div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon bg-success bg-opacity-15 text-success border border-success border-opacity-25" style={{ width: '44px', height: '44px' }}><Users size={18} /></div>
                    <div><span className="small text-muted d-block" style={{ fontSize: '12px' }}>Active Guests</span><span className="fs-5 fw-bold text-white">{analytics.summary.activeVisitors}</span></div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25" style={{ width: '44px', height: '44px' }}><ShieldAlert size={18} /></div>
                    <div><span className="small text-muted d-block" style={{ fontSize: '12px' }}>System Logs</span><span className="fs-5 fw-bold text-white">{analytics.summary.securityAlerts}</span></div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="glass-card p-4 mb-4" style={{ height: '320px' }}>
                    <h4 className="fs-6 fw-bold text-white mb-3">Daily Visitor Traffic (Last 7 Days)</h4>
                    <div className="w-100 h-100" style={{ maxHeight: '230px' }}>
                      <Line data={lineChartData} options={chartOptions} />
                    </div>
                  </div>
                  <div className="glass-card p-4" style={{ height: '320px' }}>
                    <h4 className="fs-6 fw-bold text-white mb-3">Traffic by Host Department</h4>
                    <div className="w-100 h-100" style={{ maxHeight: '230px' }}>
                      <Bar data={barChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="glass-card p-4 h-100" style={{ minHeight: '400px' }}>
                    <h4 className="fs-6 fw-bold text-white mb-4">Visit Purposes Breakdown</h4>
                    <div className="w-100 d-flex justify-content-center" style={{ height: '220px' }}>
                      <Doughnut data={doughnutData} options={{ ...chartOptions, maintainAspectRatio: false }} />
                    </div>
                    <div className="mt-4 small text-secondary">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Total Employees Registered:</span>
                        <span className="text-white fw-semibold">{analytics.summary.totalEmployees}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Available Meeting Rooms:</span>
                        <span className="text-white fw-semibold">{analytics.summary.availableRooms}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: EMPLOYEES
              ========================================== */}
          {activeTab === 'employees' && (
            <div className="glass-card p-4 animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold m-0 text-white">Employee Roster</h3>
                <button onClick={openAddEmployee} className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 py-2" style={{ background: 'var(--admin-gradient)', border: 'none', borderRadius: '8px' }}>
                  <Plus size={14} /> Add Employee
                </button>
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Location</th>
                        <th>Credentials</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id} style={{ borderColor: 'var(--border-color)' }}>
                          <td><span className="text-white fw-semibold">{emp.name}</span></td>
                          <td>{emp.email}</td>
                          <td>{emp.department}</td>
                          <td>{emp.designation}</td>
                          <td>{emp.officeLocation}</td>
                          <td>
                            <span className={`badge-custom rounded-pill py-0.5 px-2 ${emp.isActive ? 'bg-success bg-opacity-20 text-success' : 'bg-danger bg-opacity-20 text-danger'}`} style={{ fontSize: '10px' }}>
                              {emp.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              <button 
                                onClick={() => openChangePassword(emp)} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', transition: 'all 0.2s ease-in-out' }}
                                title="Change Password"
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <Key size={14} />
                              </button>
                              
                              <button 
                                onClick={() => openEditEmployee(emp)} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', transition: 'all 0.2s ease-in-out' }}
                                title="Edit Profile"
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <Edit size={14} />
                              </button>
                              
                              <button 
                                onClick={() => deleteEmployee(emp.id)} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: emp.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: emp.isActive ? '#22c55e' : '#ef4444', transition: 'all 0.2s ease-in-out' }}
                                title={emp.isActive ? "Deactivate Account" : "Activate Account"}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = emp.isActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = emp.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                {emp.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                            </div>
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
              TAB: SYSTEM USERS
              ========================================== */}
          {activeTab === 'system-users' && (
            <div className="glass-card p-4 animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold m-0 text-white">System Users & Access</h3>
                <button onClick={openAddSystemUser} className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 py-2" style={{ background: 'var(--admin-gradient)', border: 'none', borderRadius: '8px' }}>
                  <Plus size={14} /> Add User
                </button>
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th>Name</th>
                        <th>Email</th>
                        <th>System Role</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemUsers.map(u => (
                        <tr key={u.id} style={{ borderColor: 'var(--border-color)' }}>
                          <td><span className="text-white fw-semibold">{u.displayName}</span></td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-20 text-light">{u.role.toUpperCase()}</span>
                          </td>
                          <td>
                            <span className={`badge-custom rounded-pill py-0.5 px-2 ${u.isActive ? 'bg-success bg-opacity-20 text-success' : 'bg-danger bg-opacity-20 text-danger'}`} style={{ fontSize: '10px' }}>
                              {u.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              <button 
                                onClick={() => openChangePassword({id: u.id, name: u.displayName})} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', transition: 'all 0.2s ease-in-out' }}
                                title="Change Password"
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <Key size={14} />
                              </button>
                              
                              <button 
                                onClick={() => openEditSystemUser(u)} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', transition: 'all 0.2s ease-in-out' }}
                                title="Edit User"
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <Edit size={14} />
                              </button>
                              
                              <button 
                                onClick={() => deleteSystemUser(u.id)} 
                                className="btn btn-sm d-flex align-items-center justify-content-center border-0" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: u.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.isActive ? '#22c55e' : '#ef4444', transition: 'all 0.2s ease-in-out' }}
                                title={u.isActive ? "Deactivate Account" : "Activate Account"}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = u.isActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = u.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                            </div>
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
              TAB: MEETING ROOMS
              ========================================== */}
          {activeTab === 'rooms' && (
            <div className="glass-card p-4 animate-fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold m-0 text-white">Configured Rooms</h3>
                <button onClick={openAddRoom} className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 py-2" style={{ background: 'var(--admin-gradient)', border: 'none', borderRadius: '8px' }}>
                  <Plus size={14} /> Add Room
                </button>
              </div>

              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th>Room Name</th>
                        <th>Floor</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(room => (
                        <tr key={room.id} style={{ borderColor: 'var(--border-color)' }}>
                          <td><span className="text-white fw-semibold">{room.name}</span></td>
                          <td>Floor {room.floor}</td>
                          <td>{room.capacity} seats</td>
                          <td>
                            <span className={`badge-custom rounded-pill py-0.5 px-2 ${room.isAvailable ? 'bg-success bg-opacity-20 text-success' : 'bg-warning bg-opacity-20 text-warning'}`} style={{ fontSize: '10px' }}>
                              {room.isAvailable ? 'Available' : 'Occupied / Maintenance'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button onClick={() => openEditRoom(room)} className="btn btn-sm btn-outline-light me-1.5"><Edit size={12} /></button>
                            <button onClick={() => deleteRoom(room.id)} className="btn btn-sm btn-outline-danger"><Trash2 size={12} /></button>
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
              TAB: SETTINGS
              ========================================== */}
          {activeTab === 'settings' && (
            <div className="glass-card p-4 animate-fade-in">
              <h3 className="h5 fw-bold mb-4 text-white">System Settings</h3>
              
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <form onSubmit={handleSettingsSubmit} className="d-flex flex-column gap-3" style={{ maxWidth: '600px' }}>
                  
                  <div>
                    <label className="form-label small text-secondary">Organization Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-custom" 
                      value={settings.companyName || ''} 
                      onChange={e => handleSettingChange('companyName', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="form-label small text-secondary">Welcome Message (Registration Page)</label>
                    <input 
                      type="text" 
                      className="form-control form-control-custom" 
                      value={settings.welcomeMessage || ''} 
                      onChange={e => handleSettingChange('welcomeMessage', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="form-label small text-secondary">NDA Clause Agreement Text</label>
                    <textarea 
                      rows="4"
                      className="form-control form-control-custom text-white" 
                      value={settings.visitorNda || ''} 
                      onChange={e => handleSettingChange('visitorNda', e.target.value)} 
                    />
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <label className="form-label small text-secondary">Gate OTP Verification Required?</label>
                      <select 
                        className="form-select form-control-custom"
                        value={settings.otpRequired || 'false'}
                        onChange={e => handleSettingChange('otpRequired', e.target.value)}
                      >
                        <option value="true">Yes, enforce OTP</option>
                        <option value="false">No, bypass OTP</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-secondary">Alert Notification Security Email</label>
                      <input 
                        type="email" 
                        className="form-control form-control-custom" 
                        value={settings.securityEmail || ''} 
                        onChange={e => handleSettingChange('securityEmail', e.target.value)} 
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary-custom align-self-start mt-3 d-flex align-items-center gap-1.5">
                    <Save size={16} /> Save Configuration
                  </button>

                </form>
              )}
            </div>
          )}

          {/* ==========================================
              TAB: LOGS
              ========================================== */}
          {activeTab === 'logs' && (
            <div className="glass-card p-4 animate-fade-in">
              <h3 className="h5 fw-bold mb-4 text-white">Global Action Trail</h3>
              
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-dark table-hover align-middle m-0" style={{ backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th>Timestamp</th>
                        <th>User Account</th>
                        <th>Action Category</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{ borderColor: 'var(--border-color)' }}>
                          <td className="small text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="small text-white fw-semibold">{log.actorName}</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-20 text-muted" style={{ fontSize: '10px' }}>{log.action}</span>
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

        </section>
      </div>

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">Reset Password for {passwordForm.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-secondary">New Password</label>
                    <input type="password" className="form-control form-control-custom" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength="6" />
                  </div>
                </div>
                <div className="modal-footer border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning" style={{ border: 'none' }}>
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM USER CREATION MODAL */}
      {showSystemUserModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">{systemUserForm.id ? 'Edit System User' : 'Create System User'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSystemUserModal(false)}></button>
              </div>
              <form onSubmit={handleSystemUserSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-secondary">Full Name</label>
                    <input type="text" className="form-control form-control-custom" value={systemUserForm.name} onChange={e => setSystemUserForm({...systemUserForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label small text-secondary">Email Address</label>
                    <input type="email" className="form-control form-control-custom" value={systemUserForm.email} onChange={e => setSystemUserForm({...systemUserForm, email: e.target.value})} required />
                  </div>
                  <div className="row">
                    <div className={systemUserForm.id ? "col-12" : "col-6"}>
                      <label className="form-label small text-secondary">System Role</label>
                      <select className="form-select form-control-custom text-white" value={systemUserForm.role} onChange={e => setSystemUserForm({...systemUserForm, role: e.target.value})} required>
                        <option value="admin">System Admin</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="security">Security Guard</option>
                      </select>
                    </div>
                    {!systemUserForm.id && (
                      <div className="col-6">
                        <label className="form-label small text-secondary">Set Password</label>
                        <input type="password" className="form-control form-control-custom" value={systemUserForm.password} onChange={e => setSystemUserForm({...systemUserForm, password: e.target.value})} required />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top d-flex justify-content-between" style={{ borderColor: 'var(--border-color)' }}>
                  {systemUserForm.id ? (
                    <button type="button" className="btn btn-outline-danger" onClick={() => deleteSystemUserPermanent(systemUserForm.id)}>Delete Account</button>
                  ) : (
                    <div></div>
                  )}
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowSystemUserModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--admin-gradient)', border: 'none' }}>
                      {systemUserForm.id ? 'Save Changes' : 'Create Account'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE CREATION/EDIT MODAL */}
      {showEmployeeModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">{employeeForm.id ? 'Edit Staff Details' : 'Register New Staff / User'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEmployeeModal(false)}></button>
              </div>
              <form onSubmit={handleEmployeeSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-secondary">Full Name</label>
                    <input type="text" className="form-control form-control-custom" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label small text-secondary">Email Address</label>
                    <input type="email" className="form-control form-control-custom" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} required />
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label small text-secondary">Department</label>
                      <select className="form-select form-control-custom text-white" value={employeeForm.department} onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})} required>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="HR / Legal">HR / Legal</option>
                        <option value="Sales / Marketing">Sales & Marketing</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-secondary">Designation</label>
                      <input type="text" className="form-control form-control-custom" value={employeeForm.designation} onChange={e => setEmployeeForm({...employeeForm, designation: e.target.value})} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label small text-secondary">Office Desk Location</label>
                      <input type="text" className="form-control form-control-custom" value={employeeForm.officeLocation} onChange={e => setEmployeeForm({...employeeForm, officeLocation: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-secondary">Phone Number</label>
                      <input type="tel" className="form-control form-control-custom" value={employeeForm.phoneNumber} onChange={e => setEmployeeForm({...employeeForm, phoneNumber: e.target.value})} />
                    </div>
                  </div>
                  {!employeeForm.id && (
                    <div>
                      <label className="form-label small text-secondary">Set Password</label>
                      <input type="password" className="form-control form-control-custom" value={employeeForm.password} onChange={e => setEmployeeForm({...employeeForm, password: e.target.value})} required />
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top d-flex justify-content-between" style={{ borderColor: 'var(--border-color)' }}>
                  {employeeForm.id ? (
                    <button type="button" className="btn btn-outline-danger" onClick={() => deleteEmployeePermanent(employeeForm.id)}>Delete Employee</button>
                  ) : (
                    <div></div>
                  )}
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--admin-gradient)', border: 'none' }}>
                      {employeeForm.id ? 'Save Changes' : 'Create Account'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MEETING ROOM MODAL */}
      {showRoomModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 glass-card bg-secondary text-white" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h5 className="modal-title fw-bold text-white">{roomForm.id ? 'Edit Meeting Room' : 'Configure New Meeting Room'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomModal(false)}></button>
              </div>
              <form onSubmit={handleRoomSubmit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small text-secondary">Room Name</label>
                    <input type="text" className="form-control form-control-custom" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} required />
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label small text-secondary">Floor</label>
                      <input type="text" className="form-control form-control-custom" placeholder="e.g. 1, 3, G" value={roomForm.floor} onChange={e => setRoomForm({...roomForm, floor: e.target.value})} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-secondary">Maximum Seating Capacity</label>
                      <input type="number" className="form-control form-control-custom" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-check form-switch mt-2">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="roomAvailableCheck" 
                      checked={roomForm.isAvailable} 
                      onChange={e => setRoomForm({...roomForm, isAvailable: e.target.checked})} 
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label small text-secondary" htmlFor="roomAvailableCheck" style={{ cursor: 'pointer' }}>
                      Room is active and available for guest allocations
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--admin-gradient)', border: 'none' }}>
                    {roomForm.id ? 'Save Changes' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
