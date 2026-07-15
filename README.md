# 🏢 Visitor Management System (VMS SaaS)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)

A highly secure, multi-tenant Visitor Management System built for the modern enterprise. This platform allows multiple independent companies to securely track, approve, and manage guest visits in real-time without their data ever crossing paths.

## ✨ Key Features

- 🏢 **Multi-Tenant Architecture**: Strict organizational data isolation. One unified platform, thousands of independent companies.
- 🔐 **Role-Based Access Control (RBAC)**: Distinct, secure portals for System Admins, Host Employees, Receptionists, and Security Guards.
- 📷 **Real-Time Data Capture**: Integrated webcam support for visitor photo ID capture.
- 📱 **QR Code Generation**: Instantly generates secure QR codes for digital visitor passes.
- 🎨 **Premium UI/UX**: Designed with a sleek, responsive Glassmorphism aesthetic and smooth micro-animations.

## 🛠️ Technology Stack

**Frontend**
- React 18
- Vite
- Bootstrap 5 & Custom Vanilla CSS (Glassmorphism)
- React Router DOM
- Lucide React (Icons)

**Backend**
- Node.js & Express.js
- Firebase Admin SDK (Firestore Database)
- JSON Web Tokens (JWT) for secure authentication
- bcryptjs for password hashing

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/dharaneesh3222/vms_project.git
cd vms_project
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
```
*Note: You must also place your Firebase credentials file (`firebase-service-account.json`) in the root directory.*

Start the backend server:
```bash
npm run start
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

## ☁️ Deployment

This project is fully configured for cloud deployment:
- **Backend:** Designed for [Render](https://render.com) (Node Web Service) utilizing `/etc/secrets/` for Firebase credential isolation.
- **Frontend:** Designed for [Vercel](https://vercel.com) using Vite build presets.

## 🤝 Author
Built by **Dharaneesh V**
