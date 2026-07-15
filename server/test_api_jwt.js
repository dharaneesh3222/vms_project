import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env.config.js';

// Manually generate token for admin
const token = jwt.sign(
  { id: '1', role: 'admin', email: 'admin@vms.com', orgId: 'default' },
  env.JWT_SECRET,
  { expiresIn: '8h' }
);

const empOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/employees',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
};

http.request(empOptions, (empRes) => {
  let empBody = '';
  empRes.on('data', d => empBody += d);
  empRes.on('end', () => {
    console.log('Employees Data:', empBody.substring(0, 500));
    process.exit(0);
  });
}).end();
