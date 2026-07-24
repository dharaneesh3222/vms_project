import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/rbac.middleware.js';
import { logAction } from '../utils/logger.js';
import { sendVisitorApprovalNotification } from '../utils/mailer.js';

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware(['receptionist', 'admin']));

// GET /api/receptionist/queue - Get queue of today's visits (Pending, Approved, CheckedIn)
router.get('/queue', async (req, res) => {
  try {
    const visits = await db.find('visits');
    
    const enriched = await Promise.all(
      visits.map(async (visit) => {
        const visitor = await db.findOne('visitors', { id: visit.visitorId });
        const host = await db.findOne('employees', { id: visit.hostEmployeeId });
        const room = visit.meetingRoomId ? await db.findOne('meeting_rooms', { id: visit.meetingRoomId }) : null;
        const badge = await db.findOne('visitor_badges', { visitId: visit.id, returnedAt: null });

        return {
          ...visit,
          visitorName: visitor ? visitor.fullName : 'Unknown',
          visitorCompany: visitor ? visitor.company : 'N/A',
          visitorPhone: visitor ? visitor.phoneNumber : 'N/A',
          visitorPhoto: visitor ? visitor.photoUrl : '',
          hostName: host ? host.name : 'Unknown Host',
          hostDepartment: host ? host.department : 'N/A',
          meetingRoomName: room ? room.name : '',
          badgeNumber: badge ? badge.badgeNumber : ''
        };
      })
    );

    // Sort by status priority (Pending -> Approved -> CheckedIn -> CheckedOut) and then date
    const statusPriority = {
      'Pending': 1,
      'Approved': 2,
      'CheckedIn': 3,
      'CheckedOut': 4,
      'Rejected': 5
    };

    enriched.sort((a, b) => {
      const diff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (diff !== 0) return diff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json(enriched);
  } catch (err) {
    console.error('Reception queue fetch error:', err);
    return res.status(500).json({ message: 'Failed to retrieve visitor queue' });
  }
});

// GET /api/receptionist/rooms - Get all meeting rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await db.find('meeting_rooms');
    return res.json(rooms);
  } catch (err) {
    console.error('Reception rooms fetch error:', err);
    return res.status(500).json({ message: 'Failed to retrieve meeting rooms' });
  }
});

// POST /api/receptionist/walkin - Register a walk-in visitor directly (pre-approved)
router.post('/walkin', async (req, res) => {
  const { 
    fullName, email, phone, company, purpose, 
    hostEmployeeId, idType, photoBase64, idDocumentBase64 
  } = req.body;

  if (!fullName || !phone || !hostEmployeeId) {
    return res.status(400).json({ message: 'Name, phone number, and host employee are required' });
  }

  try {
    // 1. Create or Update Visitor
    let visitor = await db.findOne('visitors', { phoneNumber: phone });
    if (!visitor) {
      visitor = await db.insert('visitors', {
        fullName,
        email: email || '',
        phoneNumber: phone,
        company: company || '',
        photoUrl: photoBase64 || '',
        idDocumentUrl: idDocumentBase64 || '',
        idType: idType || 'National ID'
      });
    } else {
      visitor = await db.update('visitors', { id: visitor.id }, {
        fullName,
        email: email || visitor.email,
        company: company || visitor.company,
        photoUrl: photoBase64 || visitor.photoUrl,
        idDocumentUrl: idDocumentBase64 || visitor.idDocumentUrl,
        idType: idType || visitor.idType
      });
    }

    const host = await db.findOne('employees', { id: hostEmployeeId });
    if (!host) {
      return res.status(400).json({ message: 'Host employee not found' });
    }

    // 2. Create Visit (pre-approved because registered by receptionist)
    const visit = await db.insert('visits', {
      visitorId: visitor.id,
      hostEmployeeId: host.id,
      receptionistId: req.user.id,
      meetingRoomId: null,
      purpose: purpose || 'Walk-in Meeting',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'Approved',
      approvalDate: new Date().toISOString(),
      checkInTime: null,
      checkOutTime: null,
      qrCode: ''
    });

    // 3. Create Approval Record
    await db.insert('approvals', {
      visitorId: visitor.id,
      employeeId: host.id,
      visitId: visit.id,
      status: 'Approved',
      requestedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      remarks: 'Walk-in registration verified by receptionist'
    });

    // 4. Create Notification for Host
    await db.insert('notifications', {
      recipientId: host.id,
      visitId: visit.id,
      type: 'WALK_IN_ARRIVAL',
      message: `Walk-in visitor ${visitor.fullName} (${visitor.company || 'N/A'}) has been registered at reception and is waiting for check-in.`,
      channel: 'web',
      sentAt: new Date().toISOString(),
      isRead: false
    });
    // Send Email Entry Pass to Walk-in Visitor
    if (visitor.email) {
      sendVisitorApprovalNotification({
        visitorEmail: visitor.email,
        visitorName: visitor.fullName,
        hostName: host.name,
        scheduledDate: visit.scheduledDate,
        scheduledTime: visit.scheduledTime,
        purpose: visit.purpose,
        visitId: visit.id,
        visitorPhone: visitor.phoneNumber
      }).catch(err => console.error('Walkin visitor email error:', err));
    }

    await logAction(req.user.id, visit.id, 'WALK_IN_REGISTERED', `Receptionist registered walk-in visitor ${fullName}`);

    return res.status(201).json({
      message: 'Walk-in registered successfully!',
      visitId: visit.id,
      status: 'Approved'
    });
  } catch (err) {
    console.error('Walkin registration error:', err);
    return res.status(500).json({ message: 'Failed to register walk-in visitor' });
  }
});

// POST /api/receptionist/checkin/:visitId - Check-in visitor & assign room & badge
router.post('/checkin/:visitId', async (req, res) => {
  const { visitId } = req.params;
  const { roomId, badgeNumber } = req.body;

  if (!badgeNumber) {
    return res.status(400).json({ message: 'Visitor badge number is required' });
  }

  try {
    const visit = await db.findOne('visits', { id: visitId });
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    if (visit.status !== 'Approved') {
      return res.status(400).json({ message: `Cannot check in. Current status: ${visit.status}` });
    }

    // Verify room exists and is available
    if (roomId) {
      const room = await db.findOne('meeting_rooms', { id: roomId });
      if (!room) {
        return res.status(400).json({ message: 'Selected meeting room not found' });
      }
    }

    // Update visit details
    const updatedVisit = await db.update('visits', { id: visitId }, {
      status: 'CheckedIn',
      checkInTime: new Date().toISOString(),
      meetingRoomId: roomId || null,
      receptionistId: req.user.id
    });

    // Create Badge assignment
    await db.insert('visitor_badges', {
      visitId,
      badgeNumber,
      issuedAt: new Date().toISOString(),
      returnedAt: null,
      issuedBy: req.user.id
    });

    // Create host notification
    await db.insert('notifications', {
      recipientId: visit.hostEmployeeId,
      visitId,
      type: 'VISITOR_ARRIVED',
      message: `Your visitor has checked in at reception and is heading to ${roomId ? 'allocated meeting room' : 'your desk'}.`,
      channel: 'web',
      sentAt: new Date().toISOString(),
      isRead: false
    });

    // Log the check-in
    await logAction(req.user.id, visitId, 'CHECK_IN', `Checked in visitor. Room: ${roomId || 'None'}, Badge: ${badgeNumber}`);

    return res.json({
      message: 'Visitor checked in successfully',
      visit: updatedVisit
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ message: 'Failed to check in visitor' });
  }
});

export default router;
