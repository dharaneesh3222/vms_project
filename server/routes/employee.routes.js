import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/rbac.middleware.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// Apply auth protection & restrict to Employee or Admin
router.use(authMiddleware);
router.use(rbacMiddleware(['employee', 'admin']));

// GET /api/employee/visits - List all visits where current user is host
router.get('/visits', async (req, res) => {
  try {
    const visits = await db.find('visits', { hostEmployeeId: req.user.id });
    
    // Enrich with visitor details
    const enrichedVisits = await Promise.all(
      visits.map(async (visit) => {
        const visitor = await db.findOne('visitors', { id: visit.visitorId });
        const room = visit.meetingRoomId ? await db.findOne('meeting_rooms', { id: visit.meetingRoomId }) : null;
        return {
          ...visit,
          visitorName: visitor ? visitor.fullName : 'Unknown',
          visitorCompany: visitor ? visitor.company : 'N/A',
          visitorPhone: visitor ? visitor.phoneNumber : 'N/A',
          visitorEmail: visitor ? visitor.email : 'N/A',
          visitorPhoto: visitor ? visitor.photoUrl : '',
          meetingRoomName: room ? room.name : 'N/A'
        };
      })
    );
    
    // Sort descending by creation date
    enrichedVisits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(enrichedVisits);
  } catch (err) {
    console.error('Employee visits fetch error:', err);
    return res.status(500).json({ message: 'Failed to retrieve visits list' });
  }
});

// GET /api/employee/pending - List pending approval requests
router.get('/pending', async (req, res) => {
  try {
    const visits = await db.find('visits', { 
      hostEmployeeId: req.user.id,
      status: 'Pending'
    });

    const enriched = await Promise.all(
      visits.map(async (visit) => {
        const visitor = await db.findOne('visitors', { id: visit.visitorId });
        const approval = await db.findOne('approvals', { visitId: visit.id });
        return {
          ...visit,
          visitorName: visitor ? visitor.fullName : 'Unknown',
          visitorCompany: visitor ? visitor.company : 'N/A',
          visitorPhone: visitor ? visitor.phoneNumber : 'N/A',
          photoUrl: visitor ? visitor.photoUrl : '',
          idType: visitor ? visitor.idType : '',
          approvalId: approval ? approval.id : null,
          requestedAt: approval ? approval.requestedAt : visit.createdAt
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error('Pending approvals fetch error:', err);
    return res.status(500).json({ message: 'Failed to retrieve pending approvals' });
  }
});

// POST /api/employee/approve/:visitId - Approve a visitor request
router.post('/approve/:visitId', async (req, res) => {
  const { visitId } = req.params;
  const { remarks } = req.body;

  try {
    const visit = await db.findOne('visits', { id: visitId, hostEmployeeId: req.user.id });
    if (!visit) {
      return res.status(404).json({ message: 'Visit request not found or not assigned to you' });
    }

    if (visit.status !== 'Pending') {
      return res.status(400).json({ message: `Visit request is already ${visit.status}` });
    }

    // Update Visit Status
    const updatedVisit = await db.update('visits', { id: visitId }, {
      status: 'Approved',
      approvalDate: new Date().toISOString()
    });

    // Update Approval Record
    await db.update('approvals', { visitId }, {
      status: 'Approved',
      decidedAt: new Date().toISOString(),
      remarks: remarks || 'Approved by host employee'
    });

    // Send Notification to Receptionist Queue (broadcast)
    // We can insert a notification for all receptionists or just log it
    const receptionists = await db.find('users', { role: 'receptionist' });
    for (const recep of receptionists) {
      await db.insert('notifications', {
        recipientId: recep.id,
        visitId: visitId,
        type: 'VISIT_APPROVED',
        message: `Visitor request for host ${req.user.displayName} is APPROVED. Ready for check-in.`,
        channel: 'web',
        sentAt: new Date().toISOString(),
        isRead: false
      });
    }

    await logAction(req.user.id, visitId, 'VISIT_APPROVED', `Host approved visit for visitor ID: ${visit.visitorId}. Remarks: ${remarks || 'None'}`);

    return res.json({
      message: 'Visit request successfully approved!',
      visit: updatedVisit
    });
  } catch (err) {
    console.error('Approve visit error:', err);
    return res.status(500).json({ message: 'Failed to approve request' });
  }
});

// POST /api/employee/reject/:visitId - Reject a visitor request
router.post('/reject/:visitId', async (req, res) => {
  const { visitId } = req.params;
  const { remarks } = req.body;

  try {
    const visit = await db.findOne('visits', { id: visitId, hostEmployeeId: req.user.id });
    if (!visit) {
      return res.status(404).json({ message: 'Visit request not found or not assigned to you' });
    }

    if (visit.status !== 'Pending') {
      return res.status(400).json({ message: `Visit request is already ${visit.status}` });
    }

    // Update Visit Status
    const updatedVisit = await db.update('visits', { id: visitId }, {
      status: 'Rejected'
    });

    // Update Approval Record
    await db.update('approvals', { visitId }, {
      status: 'Rejected',
      decidedAt: new Date().toISOString(),
      remarks: remarks || 'Rejected by host employee'
    });

    await logAction(req.user.id, visitId, 'VISIT_REJECTED', `Host rejected visit for visitor ID: ${visit.visitorId}. Remarks: ${remarks || 'None'}`);

    return res.json({
      message: 'Visit request successfully rejected',
      visit: updatedVisit
    });
  } catch (err) {
    console.error('Reject visit error:', err);
    return res.status(500).json({ message: 'Failed to reject request' });
  }
});

export default router;
