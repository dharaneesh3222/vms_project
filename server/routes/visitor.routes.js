import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { db } from '../database/db.js';
import { logAction } from '../utils/logger.js';
import { sendHostApprovalNotification } from '../utils/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads folder exists
try {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
} catch (err) {
  // Ignored if exists
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// GET /api/visitors/organizations - Get list of active organizations
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await db.find('organizations');
    const safeOrgs = orgs.filter(o => o.isActive).map(o => ({ id: o.id, name: o.name }));
    return res.json(safeOrgs);
  } catch (err) {
    console.error('Fetch orgs error:', err);
    return res.status(500).json({ message: 'Failed to retrieve organizations' });
  }
});

// GET /api/visitors/hosts - Get list of hosts for registration dropdown
router.get('/hosts', async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) return res.json([]); // Require orgId
  
  try {
    const employees = await db.find('employees', { orgId });
    return res.json(employees);
  } catch (err) {
    console.error('Fetch hosts error:', err);
    return res.status(500).json({ message: 'Failed to retrieve employees' });
  }
});

// POST /api/visitors/register - Visitor pre-registration
router.post('/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      orgId, fullName, email, phone, company, purpose, 
      hostEmployeeId, idType, scheduledDate, scheduledTime,
      photoBase64, idDocumentBase64 
    } = req.body;

    if (!orgId || !fullName || !phone || !hostEmployeeId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'Organization, Name, phone, host employee, date and time are required' });
    }

    // Determine photo and document URLs (files or base64)
    let photoUrl = '';
    let idDocumentUrl = '';

    // If files uploaded via Multer
    if (req.files) {
      if (req.files['photo']) {
        photoUrl = `/uploads/${req.files['photo'][0].filename}`;
      }
      if (req.files['idDocument']) {
        idDocumentUrl = `/uploads/${req.files['idDocument'][0].filename}`;
      }
    }

    // Fallback/alternative: base64 strings (e.g. from camera/canvas)
    if (!photoUrl && photoBase64) {
      photoUrl = photoBase64;
    }
    if (!idDocumentUrl && idDocumentBase64) {
      idDocumentUrl = idDocumentBase64;
    }

    // 1. Create or Update Visitor
    let visitor = await db.findOne('visitors', { phoneNumber: phone, orgId });
    if (!visitor) {
      visitor = await db.insert('visitors', {
        orgId,
        fullName,
        email: email || '',
        phoneNumber: phone,
        company: company || '',
        photoUrl,
        idDocumentUrl,
        idType: idType || 'National ID'
      });
    } else {
      // Update details
      visitor = await db.update('visitors', { id: visitor.id }, {
        fullName,
        email: email || visitor.email,
        company: company || visitor.company,
        photoUrl: photoUrl || visitor.photoUrl,
        idDocumentUrl: idDocumentUrl || visitor.idDocumentUrl,
        idType: idType || visitor.idType
      });
    }

    // Fetch employee details to verify
    const host = await db.findOne('employees', { id: hostEmployeeId });
    if (!host) {
      return res.status(400).json({ message: 'Host employee not found' });
    }

    // 2. Create Visit Request
    const visit = await db.insert('visits', {
      orgId,
      visitorId: visitor.id,
      hostEmployeeId: host.id,
      receptionistId: null,
      meetingRoomId: null,
      purpose: purpose || 'Business Meeting',
      scheduledDate,
      scheduledTime,
      status: 'Pending',
      approvalDate: null,
      checkInTime: null,
      checkOutTime: null,
      qrCode: '' // generated after approval
    });

    // 3. Create Approval Record
    const approval = await db.insert('approvals', {
      orgId,
      visitorId: visitor.id,
      employeeId: host.id,
      visitId: visit.id,
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      decidedAt: null,
      remarks: ''
    });

    // 4. Create Notification for Employee
    await db.insert('notifications', {
      orgId,
      recipientId: host.id,
      visitId: visit.id,
      type: 'APPROVAL_REQUEST',
      message: `New visit approval request from ${visitor.fullName} (${visitor.company || 'N/A'}) scheduled for ${scheduledDate} at ${scheduledTime}.`,
      channel: 'web',
      sentAt: new Date().toISOString(),
      isRead: false
    });

    // 5. Send Email Notification to Host Employee
    const hostUser = await db.findOne('users', { id: host.id });
    sendHostApprovalNotification({
      hostEmail: hostUser ? hostUser.email : '',
      hostName: host.name,
      visitorName: visitor.fullName,
      visitorCompany: visitor.company,
      visitorPhone: visitor.phoneNumber,
      scheduledDate,
      scheduledTime,
      purpose: purpose || 'Business Meeting',
      visitId: visit.id
    }).catch(err => console.error('Host approval email error:', err));

    await logAction(null, visit.id, 'VISIT_REGISTERED', `Visitor ${fullName} registered for host ${host.name}`);

    return res.status(201).json({
      message: 'Registration successful! Awaiting host approval.',
      visitId: visit.id,
      status: 'Pending'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Failed to complete registration' });
  }
});

// GET /api/visitors/status/:phone - Check status of visit by phone
router.get('/status/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const visitor = await db.findOne('visitors', { phoneNumber: phone });
    if (!visitor) {
      return res.status(404).json({ message: 'No visitor record found for this phone number' });
    }

    const visits = await db.find('visits', { visitorId: visitor.id });
    if (visits.length === 0) {
      return res.status(404).json({ message: 'No visits found for this visitor' });
    }

    // Sort by date descending
    visits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestVisit = visits[0];
    
    const host = await db.findOne('employees', { id: latestVisit.hostEmployeeId });

    return res.json({
      visitor,
      visit: latestVisit,
      hostName: host ? host.name : 'Unknown Host'
    });
  } catch (err) {
    console.error('Check status error:', err);
    return res.status(500).json({ message: 'Failed to retrieve visit status' });
  }
});

// GET /api/visitors/pass/:id - Download visitor pass and QR
router.get('/pass/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await db.findOne('visits', { id });
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    if (visit.status !== 'Approved' && visit.status !== 'CheckedIn' && visit.status !== 'CheckedOut') {
      return res.status(400).json({ message: `Pass is not active. Status: ${visit.status}` });
    }

    const visitor = await db.findOne('visitors', { id: visit.visitorId });
    const host = await db.findOne('employees', { id: visit.hostEmployeeId });
    const room = visit.meetingRoomId ? await db.findOne('meeting_rooms', { id: visit.meetingRoomId }) : null;

    // Generate dynamic QR Code Data URL if not already done or just generate fresh
    // QR Code encodes the visit ID so security guard scans it and looks up visit ID!
    const qrCodeDataUrl = await QRCode.toDataURL(visit.id);

    return res.json({
      pass: {
        visitId: visit.id,
        fullName: visitor.fullName,
        photoUrl: visitor.photoUrl,
        company: visitor.company,
        purpose: visit.purpose,
        hostName: host ? host.name : 'N/A',
        department: host ? host.department : 'N/A',
        scheduledDate: visit.scheduledDate,
        scheduledTime: visit.scheduledTime,
        meetingRoom: room ? room.name : 'TBD',
        floor: room ? room.floor : 'TBD',
        qrCode: qrCodeDataUrl,
        status: visit.status,
        checkInTime: visit.checkInTime,
        checkOutTime: visit.checkOutTime
      }
    });
  } catch (err) {
    console.error('Get pass error:', err);
    return res.status(500).json({ message: 'Failed to generate visitor pass' });
  }
});

export default router;
