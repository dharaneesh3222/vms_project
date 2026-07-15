import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { env } from '../config/env.config.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// POST /api/auth/register-organization
router.post('/register-organization', async (req, res) => {
  const { orgName, adminName, adminEmail, adminPassword } = req.body;
  if (!orgName || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await db.findOne('users', { email: adminEmail.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const org = await db.insert('organizations', {
      name: orgName,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = await db.insert('users', {
      orgId: org.id,
      email: adminEmail.toLowerCase().trim(),
      displayName: adminName,
      passwordHash,
      rawPassword: adminPassword,
      role: 'admin',
      department: 'Management',
      isActive: true
    });

    await logAction(admin.id, null, 'ORG_REGISTERED', `New organization registered: ${orgName}`);

    return res.status(201).json({
      message: 'Organization registered successfully',
      orgId: org.id
    });
  } catch (err) {
    console.error('Register org error:', err);
    return res.status(500).json({ message: 'Server error registering organization' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db.findOne('users', { email: email.toLowerCase().trim() });
    if (!user) {
      await logAction(null, null, 'LOGIN_FAILED', `Attempted login for non-existent email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      await logAction(user.id, null, 'LOGIN_BLOCKED', `Inactive user attempted login: ${email}`);
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAction(user.id, null, 'LOGIN_FAILED', `Failed password attempt for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, orgId: user.orgId || 'default' },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAction(user.id, null, 'LOGIN_SUCCESS', `User logged in successfully`);

    // Fetch employee details if role is employee
    let employeeDetails = null;
    if (user.role === 'employee') {
      employeeDetails = await db.findOne('employees', { id: user.id });
    }

    return res.json({
      token,
      user: {
        id: user.id,
        orgId: user.orgId || 'default',
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        employeeDetails
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let employeeDetails = null;
    if (user.role === 'employee') {
      employeeDetails = await db.findOne('employees', { id: user.id });
    }

    return res.json({
      id: user.id,
      orgId: user.orgId || 'default',
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      phoneNumber: user.phoneNumber,
      employeeDetails
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

export default router;
