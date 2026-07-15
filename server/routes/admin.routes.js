import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rbacMiddleware } from '../middleware/rbac.middleware.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware(['admin']));

// ==========================================
// 1. Employee Management
// ==========================================

// GET /api/admin/employees - Get all employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await db.find('employees');
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const user = await db.findOne('users', { id: emp.id });
        return {
          ...emp,
          email: user ? user.email : '',
          isActive: user ? user.isActive : false,
          phoneNumber: user ? user.phoneNumber : ''
        };
      })
    );
    return res.json(enriched);
  } catch (err) {
    console.error('Admin fetch employees error:', err);
    return res.status(500).json({ message: 'Failed to retrieve employees' });
  }
});

// POST /api/admin/employees - Create new employee
router.post('/employees', async (req, res) => {
  const { name, email, department, designation, officeLocation, phoneNumber, password } = req.body;

  if (!name || !email || !department || !designation || !password) {
    return res.status(400).json({ message: 'Name, email, department, designation, and password are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await db.findOne('users', { email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 1. Create user account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.insert('users', {
      email: email.toLowerCase().trim(),
      displayName: name,
      passwordHash,
      rawPassword: password,
      role: 'employee',
      department,
      phoneNumber: phoneNumber || '',
      isActive: true
    });

    // 2. Create employee profile
    const newEmpProfile = await db.insert('employees', {
      id: newUser.id, // match user ID
      name,
      department,
      designation,
      officeLocation: officeLocation || 'N/A'
    });

    await logAction(req.user.id, null, 'EMPLOYEE_CREATED', `Admin created employee account: ${name} (${email})`);

    return res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        ...newEmpProfile,
        email: newUser.email,
        isActive: newUser.isActive,
        phoneNumber: newUser.phoneNumber
      }
    });
  } catch (err) {
    console.error('Admin create employee error:', err);
    return res.status(500).json({ message: 'Failed to create employee' });
  }
});

// PUT /api/admin/employees/:id - Update employee
router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, department, designation, officeLocation, phoneNumber, isActive } = req.body;

  try {
    const emp = await db.findOne('employees', { id });
    if (!emp) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const userUpdates = {};
    if (email) {
      const parsedEmail = email.toLowerCase().trim();
      const existingUser = await db.findOne('users', { email: parsedEmail });
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
      userUpdates.email = parsedEmail;
    }

    // Update employee profile
    const updatedEmp = await db.update('employees', { id }, {
      name: name || emp.name,
      department: department || emp.department,
      designation: designation || emp.designation,
      officeLocation: officeLocation || emp.officeLocation
    });

    // Update user account
    if (name) userUpdates.displayName = name;
    if (department) userUpdates.department = department;
    if (phoneNumber !== undefined) userUpdates.phoneNumber = phoneNumber;
    if (isActive !== undefined) userUpdates.isActive = isActive;

    if (Object.keys(userUpdates).length > 0) {
      await db.update('users', { id }, userUpdates);
    }

    await logAction(req.user.id, null, 'EMPLOYEE_UPDATED', `Admin updated employee details for: ${updatedEmp.name}`);

    return res.json({
      message: 'Employee updated successfully',
      employee: updatedEmp
    });
  } catch (err) {
    console.error('Admin update employee error:', err);
    return res.status(500).json({ message: 'Failed to update employee' });
  }
});

// PUT /api/admin/employees/:id/password - Reset employee password
router.put('/employees/:id/password', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password is required' });

  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await db.update('users', { id }, { passwordHash, rawPassword: newPassword });

    await logAction(req.user.id, null, 'PASSWORD_RESET', `Admin reset password for user: ${user.email}`);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Admin password reset error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

// DELETE /api/admin/employees/:id - Toggle active/inactive
router.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.findOne('users', { id });
    if (!user) {
      return res.status(404).json({ message: 'Employee user not found' });
    }

    // Deactivate user instead of hard deletion to maintain audit log integrity
    const newStatus = !user.isActive;
    await db.update('users', { id }, { isActive: newStatus });
    
    await logAction(req.user.id, null, newStatus ? 'EMPLOYEE_REACTIVATED' : 'EMPLOYEE_DEACTIVATED', `Admin toggled status of ${user.displayName} to ${newStatus ? 'Active' : 'Inactive'}`);

    return res.json({ message: `Employee status updated to ${newStatus ? 'Active' : 'Inactive'}` });
  } catch (err) {
    console.error('Admin delete employee error:', err);
    return res.status(500).json({ message: 'Failed to toggle employee status' });
  }
});

router.delete('/employees/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    await db.delete('users', { id });
    await logAction(req.user.id, null, 'EMPLOYEE_DELETED', `Admin permanently deleted employee: ${user.email}`);

    return res.json({ message: 'Employee permanently deleted.' });
  } catch (err) {
    console.error('Permanent delete employee error:', err);
    return res.status(500).json({ message: 'Failed to permanently delete employee' });
  }
});

// ==========================================
// 1B. System Users Management (Admins, Receptionists, Security)
// ==========================================

router.get('/system-users', async (req, res) => {
  try {
    const users = await db.find('users');
    const systemUsers = users.filter(u => u.role === 'admin' || u.role === 'receptionist' || u.role === 'security');
    
    // exclude the password hashes before sending
    const safeUsers = systemUsers.map(u => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });
    
    return res.json(safeUsers);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve system users' });
  }
});

router.post('/system-users', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, role, and password are required' });
  }
  
  if (!['admin', 'receptionist', 'security'].includes(role)) {
    return res.status(400).json({ message: 'Invalid system role' });
  }

  try {
    const existingUser = await db.findOne('users', { email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.insert('users', {
      email: email.toLowerCase().trim(),
      displayName: name,
      passwordHash,
      rawPassword: password,
      role: role,
      isActive: true,
      department: role.charAt(0).toUpperCase() + role.slice(1) // Admin, Receptionist, Security
    });

    await logAction(req.user.id, null, 'SYSTEM_USER_CREATED', `Admin created ${role} account: ${email}`);
    
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ message: 'System user created successfully', user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create system user' });
  }
});

router.put('/system-users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required' });
  }

  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (email.toLowerCase().trim() !== user.email) {
      const existing = await db.findOne('users', { email: email.toLowerCase().trim() });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
    }

    await db.update('users', { id }, {
      displayName: name,
      email: email.toLowerCase().trim(),
      role,
      department: role.charAt(0).toUpperCase() + role.slice(1)
    });
    
    await logAction(req.user.id, null, 'SYSTEM_USER_UPDATED', `Admin updated ${role} account: ${email}`);
    return res.json({ message: 'System user updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update system user' });
  }
});

router.delete('/system-users/:id', async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot deactivate your own account!' });
  }
  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newStatus = !user.isActive;
    await db.update('users', { id }, { isActive: newStatus });
    await logAction(req.user.id, null, 'SYSTEM_USER_TOGGLED', `Admin toggled status of ${user.email}`);
    return res.json({ message: `System user status toggled.` });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

router.delete('/system-users/:id/permanent', async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account!' });
  }
  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db.delete('users', { id });
    await logAction(req.user.id, null, 'SYSTEM_USER_DELETED', `Admin permanently deleted system user: ${user.email}`);
    return res.json({ message: `System user permanently deleted.` });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to permanently delete system user' });
  }
});

// ==========================================
// 2. Meeting Room Management
// ==========================================

// GET /api/admin/rooms - Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await db.find('meeting_rooms');
    return res.json(rooms);
  } catch (err) {
    console.error('Admin fetch rooms error:', err);
    return res.status(500).json({ message: 'Failed to retrieve meeting rooms' });
  }
});

// POST /api/admin/rooms - Add meeting room
router.post('/rooms', async (req, res) => {
  const { name, floor, capacity, isAvailable } = req.body;
  if (!name || !floor || !capacity) {
    return res.status(400).json({ message: 'Room name, floor, and capacity are required' });
  }

  try {
    const newRoom = await db.insert('meeting_rooms', {
      name,
      floor,
      capacity: parseInt(capacity),
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await logAction(req.user.id, null, 'ROOM_CREATED', `Admin created meeting room: ${name}`);

    return res.status(201).json({ message: 'Meeting room created successfully', room: newRoom });
  } catch (err) {
    console.error('Admin add room error:', err);
    return res.status(500).json({ message: 'Failed to add meeting room' });
  }
});

// PUT /api/admin/rooms/:id - Update meeting room
router.put('/rooms/:id', async (req, res) => {
  const { id } = req.params;
  const { name, floor, capacity, isAvailable } = req.body;

  try {
    const room = await db.findOne('meeting_rooms', { id });
    if (!room) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }

    const updatedRoom = await db.update('meeting_rooms', { id }, {
      name: name || room.name,
      floor: floor || room.floor,
      capacity: capacity !== undefined ? parseInt(capacity) : room.capacity,
      isAvailable: isAvailable !== undefined ? isAvailable : room.isAvailable
    });

    await logAction(req.user.id, null, 'ROOM_UPDATED', `Admin updated meeting room: ${updatedRoom.name}`);

    return res.json({ message: 'Meeting room updated successfully', room: updatedRoom });
  } catch (err) {
    console.error('Admin update room error:', err);
    return res.status(500).json({ message: 'Failed to update meeting room' });
  }
});

// DELETE /api/admin/rooms/:id - Delete meeting room
router.delete('/rooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const room = await db.findOne('meeting_rooms', { id });
    if (!room) {
      return res.status(404).json({ message: 'Meeting room not found' });
    }

    await db.delete('meeting_rooms', { id });
    await logAction(req.user.id, null, 'ROOM_DELETED', `Admin deleted meeting room ID: ${id}`);

    return res.json({ message: 'Meeting room deleted successfully' });
  } catch (err) {
    console.error('Admin delete room error:', err);
    return res.status(500).json({ message: 'Failed to delete meeting room' });
  }
});

// ==========================================
// 3. Settings Management
// ==========================================

// GET /api/admin/settings - Get settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.find('settings');
    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    return res.json(settingsObj);
  } catch (err) {
    console.error('Admin fetch settings error:', err);
    return res.status(500).json({ message: 'Failed to retrieve settings' });
  }
});

// POST /api/admin/settings - Update settings
router.post('/settings', async (req, res) => {
  const settingsObj = req.body; // Key-value object
  try {
    for (const key in settingsObj) {
      const s = await db.findOne('settings', { key });
      if (s) {
        await db.update('settings', { key }, { value: String(settingsObj[key]) });
      } else {
        await db.insert('settings', { key, value: String(settingsObj[key]) });
      }
    }

    await logAction(req.user.id, null, 'SETTINGS_UPDATED', `Admin updated system settings`);

    return res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Admin update settings error:', err);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
});

// ==========================================
// 4. System Analytics Dashboard
// ==========================================

// GET /api/admin/analytics - Fetch dashboards statistics
router.get('/analytics', async (req, res) => {
  try {
    const visits = await db.find('visits');
    const visitors = await db.find('visitors');
    const rooms = await db.find('meeting_rooms');
    const employees = await db.find('employees');
    const auditLogs = await db.find('audit_logs');

    const totalVisitorsCount = visitors.length;
    const totalVisitsCount = visits.length;

    // Filter today's visits (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.scheduledDate === todayStr || v.createdAt.startsWith(todayStr));
    const activeVisitorsCount = visits.filter(v => v.status === 'CheckedIn').length;
    const checkedOutCount = visits.filter(v => v.status === 'CheckedOut').length;
    const pendingCount = visits.filter(v => v.status === 'Pending').length;
    const availableRoomsCount = rooms.filter(r => r.isAvailable).length;

    // Group visits by date (last 7 days)
    const dailyVisits = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyVisits[dateStr] = 0;
    }
    visits.forEach(v => {
      const dateKey = v.scheduledDate;
      if (dailyVisits[dateKey] !== undefined) {
        dailyVisits[dateKey]++;
      }
    });

    // Group visits by purpose
    const purposeCount = {};
    visits.forEach(v => {
      purposeCount[v.purpose] = (purposeCount[v.purpose] || 0) + 1;
    });

    // Group visits by employee host department
    const deptCount = {};
    for (const v of visits) {
      const emp = employees.find(e => e.id === v.hostEmployeeId);
      if (emp) {
        deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
      } else {
        deptCount['Other'] = (deptCount['Other'] || 0) + 1;
      }
    }

    // Group visits by check-in hour (Peak visit hours)
    const hourlyCount = Array(24).fill(0);
    visits.forEach(v => {
      if (v.checkInTime) {
        const hour = new Date(v.checkInTime).getHours();
        hourlyCount[hour]++;
      }
    });

    return res.json({
      summary: {
        totalVisitors: totalVisitorsCount,
        totalVisits: totalVisitsCount,
        todaysVisitors: todayVisits.length,
        activeVisitors: activeVisitorsCount,
        checkedOut: checkedOutCount,
        pendingApprovals: pendingCount,
        availableRooms: availableRoomsCount,
        totalEmployees: employees.length,
        securityAlerts: auditLogs.filter(log => log.action.includes('FAILED') || log.action.includes('BLOCKED')).length
      },
      charts: {
        daily: {
          labels: Object.keys(dailyVisits),
          data: Object.values(dailyVisits)
        },
        purpose: {
          labels: Object.keys(purposeCount),
          data: Object.values(purposeCount)
        },
        department: {
          labels: Object.keys(deptCount),
          data: Object.values(deptCount)
        },
        hourly: {
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          data: hourlyCount
        }
      }
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return res.status(500).json({ message: 'Failed to retrieve analytics' });
  }
});

export default router;
