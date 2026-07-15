import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/rbac.middleware.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware(['security', 'admin']));

// GET /api/security/live - Get list of visitors currently inside the building
router.get('/live', async (req, res) => {
  try {
    const activeVisits = await db.find('visits', { status: 'CheckedIn' });
    
    const enriched = await Promise.all(
      activeVisits.map(async (visit) => {
        const visitor = await db.findOne('visitors', { id: visit.visitorId });
        const host = await db.findOne('employees', { id: visit.hostEmployeeId });
        const room = visit.meetingRoomId ? await db.findOne('meeting_rooms', { id: visit.meetingRoomId }) : null;
        const badge = await db.findOne('visitor_badges', { visitId: visit.id, returnedAt: null });

        return {
          ...visit,
          visitorName: visitor ? visitor.fullName : 'Unknown',
          visitorCompany: visitor ? visitor.company : 'N/A',
          visitorPhone: visitor ? visitor.phoneNumber : 'N/A',
          photoUrl: visitor ? visitor.photoUrl : '',
          hostName: host ? host.name : 'Unknown Host',
          meetingRoomName: room ? room.name : 'Desk',
          badgeNumber: badge ? badge.badgeNumber : 'N/A'
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error('Fetch live visitors error:', err);
    return res.status(500).json({ message: 'Failed to retrieve live visitors list' });
  }
});

// POST /api/security/scan - Lookup visit by scanned QR data (visitId)
router.post('/scan', async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) {
    return res.status(400).json({ message: 'Scanned QR data is required' });
  }

  try {
    // qrData is the visitId
    const visit = await db.findOne('visits', { id: qrData });
    if (!visit) {
      await logAction(req.user.id, null, 'QR_SCAN_FAILED', `Scanned invalid or non-existent QR token: ${qrData}`);
      return res.status(404).json({ message: 'Invalid QR Pass: No matching visit found' });
    }

    const visitor = await db.findOne('visitors', { id: visit.visitorId });
    const host = await db.findOne('employees', { id: visit.hostEmployeeId });
    const room = visit.meetingRoomId ? await db.findOne('meeting_rooms', { id: visit.meetingRoomId }) : null;
    const badge = await db.findOne('visitor_badges', { visitId: visit.id, returnedAt: null });

    const enrichedVisit = {
      ...visit,
      visitorName: visitor ? visitor.fullName : 'Unknown',
      visitorCompany: visitor ? visitor.company : 'N/A',
      visitorPhone: visitor ? visitor.phoneNumber : 'N/A',
      photoUrl: visitor ? visitor.photoUrl : '',
      hostName: host ? host.name : 'Unknown Host',
      hostDepartment: host ? host.department : 'N/A',
      meetingRoomName: room ? room.name : 'N/A',
      badgeNumber: badge ? badge.badgeNumber : 'N/A'
    };

    await logAction(req.user.id, visit.id, 'QR_SCANNED', `Scanned QR Code for visitor ${visitor?.fullName}. Status: ${visit.status}`);

    return res.json(enrichedVisit);
  } catch (err) {
    console.error('Scan QR error:', err);
    return res.status(500).json({ message: 'Failed to scan QR pass' });
  }
});

// POST /api/security/confirm-checkin/:visitId - Gate check-in (if done by security)
router.post('/confirm-checkin/:visitId', async (req, res) => {
  const { visitId } = req.params;
  const { badgeNumber } = req.body;

  try {
    const visit = await db.findOne('visits', { id: visitId });
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    if (visit.status !== 'Approved') {
      return res.status(400).json({ message: `Cannot check in. Visit status: ${visit.status}` });
    }

    // Update visit status
    const updatedVisit = await db.update('visits', { id: visitId }, {
      status: 'CheckedIn',
      checkInTime: new Date().toISOString()
    });

    // Create badge record if badge number is provided
    if (badgeNumber) {
      await db.insert('visitor_badges', {
        visitId,
        badgeNumber,
        issuedAt: new Date().toISOString(),
        returnedAt: null,
        issuedBy: req.user.id
      });
    }

    // Notify Host
    await db.insert('notifications', {
      recipientId: visit.hostEmployeeId,
      visitId,
      type: 'VISITOR_ARRIVED_GATE',
      message: `Your visitor has entered the premises through security gate.`,
      channel: 'web',
      sentAt: new Date().toISOString(),
      isRead: false
    });

    await logAction(req.user.id, visitId, 'GATE_CHECK_IN', `Security guard allowed entry. Badge: ${badgeNumber || 'None'}`);

    return res.json({
      message: 'Entry confirmed successfully',
      visit: updatedVisit
    });
  } catch (err) {
    console.error('Confirm gate check-in error:', err);
    return res.status(500).json({ message: 'Failed to confirm check-in' });
  }
});

// POST /api/security/confirm-checkout/:visitId - Security Check-out visitor (Gate exit)
router.post('/confirm-checkout/:visitId', async (req, res) => {
  const { visitId } = req.params;

  try {
    const visit = await db.findOne('visits', { id: visitId });
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    if (visit.status !== 'CheckedIn') {
      return res.status(400).json({ message: `Cannot check out. Visit status: ${visit.status}` });
    }

    // Update Visit Status
    const updatedVisit = await db.update('visits', { id: visitId }, {
      status: 'CheckedOut',
      checkOutTime: new Date().toISOString()
    });

    // Mark Badge as returned
    await db.update('visitor_badges', { visitId, returnedAt: null }, {
      returnedAt: new Date().toISOString()
    });

    // Notify Host
    await db.insert('notifications', {
      recipientId: visit.hostEmployeeId,
      visitId,
      type: 'VISITOR_DEPARTED',
      message: `Your visitor has checked out and departed the premises.`,
      channel: 'web',
      sentAt: new Date().toISOString(),
      isRead: false
    });

    await logAction(req.user.id, visitId, 'GATE_CHECK_OUT', `Security guard confirmed exit. Checked out visitor.`);

    return res.json({
      message: 'Exit confirmed successfully',
      visit: updatedVisit
    });
  } catch (err) {
    console.error('Confirm check-out error:', err);
    return res.status(500).json({ message: 'Failed to confirm check-out' });
  }
});

// GET /api/security/logs - Get recent security logs (audit trail)
router.get('/logs', async (req, res) => {
  try {
    const logs = await db.find('audit_logs');
    
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await db.findOne('users', { id: log.userId });
        const visit = log.visitId ? await db.findOne('visits', { id: log.visitId }) : null;
        const visitor = visit ? await db.findOne('visitors', { id: visit.visitorId }) : null;

        return {
          ...log,
          actorName: user ? user.displayName : 'System / External',
          visitorName: visitor ? visitor.fullName : 'N/A'
        };
      })
    );

    // Sort by timestamp descending
    enriched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return last 100 logs
    return res.json(enriched.slice(0, 100));
  } catch (err) {
    console.error('Fetch security logs error:', err);
    return res.status(500).json({ message: 'Failed to retrieve logs' });
  }
});

export default router;
