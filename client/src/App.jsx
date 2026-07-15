import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import VisitorRegister from './pages/VisitorRegister';
import VisitorStatus from './pages/VisitorStatus';
import VisitorPass from './pages/VisitorPass';
import RegisterOrganization from './pages/RegisterOrganization';
import EmployeePortal from './pages/EmployeePortal';
import ReceptionistPortal from './pages/ReceptionistPortal';
import SecurityPortal from './pages/SecurityPortal';
import AdminPortal from './pages/AdminPortal';

export default function App() {
  
  useEffect(() => {
    // Set default theme to premium dark on application load
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterOrganization />} />
        <Route path="/visitor/pass/:id" element={<VisitorPass />} />
        <Route path="/register-visitor" element={<VisitorRegister />} />
        <Route path="/status" element={<VisitorStatus />} />
        <Route path="/pass/:visitId" element={<VisitorPass />} />

        {/* Staff Portals */}
        <Route path="/employee" element={<EmployeePortal />} />
        <Route path="/receptionist" element={<ReceptionistPortal />} />
        <Route path="/security" element={<SecurityPortal />} />
        <Route path="/admin" element={<AdminPortal />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
