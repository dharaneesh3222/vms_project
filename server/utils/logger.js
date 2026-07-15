import { db } from '../database/db.js';

export const logAction = async (userId, visitId, action, details) => {
  try {
    await db.insert('audit_logs', {
      userId: userId || 'SYSTEM',
      visitId: visitId || null,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
