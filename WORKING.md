# VMS SaaS — Working Context Summary

> Last updated: 2026-07-24 | Purpose: Onboard a new AI session instantly.

---

## 🎯 Project Goal

Build and deploy a **production-ready, multi-tenant Visitor Management System (VMS) SaaS** platform. Multiple independent companies (tenants) register on the platform and each gets a fully isolated admin portal, staff directory, visitor queue, and security scanner — all on a single codebase.

**Live Production:**
- **Frontend (Vercel):** `https://vms-project.vercel.app`
- **Backend (Render):** `https://vms-backend-rp7s.onrender.com`
- **GitHub Repo:** `https://github.com/dharaneesh3222/vms_project`

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                  React 18 + Vite                    │
│            (Vercel - Static Hosting)                │
│   - React Router DOM for multi-page SPA routing     │
│   - Vanilla CSS + Glassmorphism dark UI             │
│   - Chart.js + react-chartjs-2 for dashboards       │
│   - lucide-react for icons                          │
│   - qrcode.react for visitor passes                 │
└─────────────────────┬───────────────────────────────┘
                      │ REST API (VITE_API_URL env var)
┌─────────────────────▼───────────────────────────────┐
│             Node.js 20 + Express.js                 │
│              (Render - Web Service)                 │
│   - JWT authentication (auth.middleware.js)         │
│   - RBAC middleware (rbac.middleware.js)             │
│   - bcryptjs for password hashing                   │
│   - Firebase Admin SDK → Firestore                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│          Firebase Firestore (NoSQL DB)               │
│   Collections: users, employees, visitors, visits,  │
│   meeting_rooms, audit_logs, organizations          │
│   Each doc tagged with orgId (multi-tenant)         │
└─────────────────────────────────────────────────────┘
```

### Key Config Files
| File | Purpose |
|---|---|
| `server/database/db.js` | Firebase init; resolves `/etc/secrets/firebase-service-account.json` on Render |
| `client/src/utils/api.js` | Central API utility; reads `VITE_API_URL` env var |
| `server/middleware/rbac.middleware.js` | Injects orgId into all DB queries for tenant isolation |
| `server/routes/admin.routes.js` | All admin CRUD + analytics endpoint |

### Environment Variables
**Render (Backend):**
- `JWT_SECRET` — JWT signing secret
- Secret File: `firebase-service-account.json` → mounted at `/etc/secrets/`

**Vercel (Frontend):**
- `VITE_API_URL` → `https://vms-backend-rp7s.onrender.com/api`

---

## 👤 User Roles & Portals

| Role | Route | Capabilities |
|---|---|---|
| `admin` | `/admin` | Full org management, analytics, staff, rooms, system config |
| `employee` | `/employee` | View + approve/reject visitor requests assigned to them |
| `receptionist` | `/receptionist` | Walk-in registration, check-in queue, room allocation |
| `security` | `/security` | QR code scanner, verify/check-in visitors at gate |
| **Public** | `/register` | Visitor self-registration (no login required) |
| **Public** | `/status?phone=` | Visitor tracks their own approval status |

---

## ✅ Completed Features

### Authentication
- [x] JWT login with role-based redirect
- [x] Session expiry detection (`?expired=true` query param)
- [x] **Role must be selected before login** (validation added)
- [x] Logout clears `localStorage`

### Admin Portal (`/admin`)
- [x] Analytics dashboard with stat cards (Total Visits, Today's Visitors, Active Guests)
- [x] **Available Rooms stat card** (shows `available / total`)
- [x] **Visitor Traffic chart with Weekly / Monthly toggle** (line chart)
- [x] Traffic by Department (bar chart)
- [x] Visit Purposes Breakdown (doughnut chart)
- [x] Employee roster with Add / Edit / Deactivate / **Permanent Delete**
- [x] System Users management (receptionists, security, admins)
- [x] Meeting Rooms management (CRUD)
- [x] System Config (org name, max capacity, etc.)
- [x] Audit Logs viewer

### Employee Portal (`/employee`)
- [x] View pending visitor approvals
- [x] Approve / Reject visitor requests

### Receptionist Portal (`/receptionist`)
- [x] Live queue of expected and walk-in visitors
- [x] Check-in flow with room allocation
- [x] **Room dropdown shows ONLY available rooms** (occupied rooms hidden)
- [x] Badge number assignment
- [x] Walk-in visitor registration modal

### Security Portal (`/security`)
- [x] QR code scanner (webcam-based)
- [x] Manual entry lookup
- [x] Check-in / Check-out action

### Visitor Self-Service
- [x] Public registration form (`/register`) — expanded to 1050px wide on desktop
- [x] Webcam photo capture for biometric logging
- [x] QR code generation and visitor pass download (`/pass`)
- [x] Status tracking page (`/status`)

### UI/UX
- [x] Glassmorphism dark theme throughout
- [x] Glowing blur border on hover for `.btn-primary-custom`
- [x] Dark mode fix for disabled `<select>` elements
- [x] Responsive design

### Deployment
- [x] Firebase credential path dynamically resolved (local dev + Render `/etc/secrets`)
- [x] `VITE_API_URL` handled with auto `/api` suffix logic
- [x] `.gitignore` protects secrets
- [x] `README.md` with badges and setup instructions

---

## 🔧 Recently Fixed Issues

| Issue | Fix |
|---|---|
| Employee delete showing "Employee user not found" error | Backend now checks both `users` AND `employees` collections before deleting |
| Employee still showing in list after delete | Permanent delete now removes from both collections |
| Room dropdown showing occupied rooms | Filtered with `.filter(r => r.isAvailable)` in `ReceptionistPortal.jsx` |
| Available Rooms not shown as stat card | Replaced "System Logs" card with "Available Rooms X/Y" card on dashboard |
| Monthly chart missing | Backend analytics now returns `charts.monthly` (last 30 days); frontend has Weekly/Monthly toggle |

---

## 📁 Key File Map

```
VMS/
├── client/src/
│   ├── pages/
│   │   ├── AdminPortal.jsx       ← Main admin dashboard
│   │   ├── VisitorRegister.jsx   ← Public guest registration (maxWidth: 1050px)
│   │   ├── Login.jsx             ← Role must be selected before login
│   │   ├── ReceptionistPortal.jsx← Available rooms filter applied
│   │   ├── EmployeePortal.jsx
│   │   ├── SecurityPortal.jsx
│   │   └── VisitorPass.jsx
│   ├── utils/api.js              ← Central API client
│   └── index.css                 ← Dark theme, glassmorphism, btn hover glow
│
├── server/
│   ├── routes/
│   │   ├── admin.routes.js       ← Analytics (weekly+monthly), employee CRUD
│   │   ├── auth.routes.js        ← Login/logout
│   │   ├── visitor.routes.js
│   │   ├── receptionist.routes.js
│   │   ├── employee.routes.js
│   │   └── security.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js    ← JWT verification
│   │   └── rbac.middleware.js    ← Role + orgId injection
│   ├── database/db.js            ← Firebase init (dual-path)
│   └── server.js                 ← Express app entry
│
├── README.md
├── WORKING.md                    ← This file
└── VMS_Project_Report.pdf        ← Generated project report
```

---

## 🔜 Pending / Next Steps

1. **Email Notifications** — Wire up SendGrid or Nodemailer for real email on visitor approval
2. **Push Notifications** — Notify host employees in-browser when a visitor arrives
3. **Visit History per Employee** — Employee portal to see past visitor records
4. **Visitor Photo on Pass** — Display the webcam-captured photo on the QR visitor pass
5. **Room Auto-Release** — When visitor checks out, mark their allocated room as `isAvailable: true` again
6. **Pagination** — Add pagination to employee list, visitor queue, and audit logs
7. **Export to CSV/PDF** — Allow admins to export visitor logs

---

## 🗒️ Active Default Test Credentials

- **Admin Login:** `admin@vms.com` / `admin123`
- (More accounts exist in Firestore under the test org)
