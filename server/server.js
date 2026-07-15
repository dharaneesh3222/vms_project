import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.config.js';
import { seedDatabase } from './database/db.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import receptionistRoutes from './routes/receptionist.routes.js';
import securityRoutes from './routes/security.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
// Set body payload limits to handle base64 image data from photo capture
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded visitor photos & documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Visitor Management System API is active.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ 
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Seed DB and Start listening
const PORT = env.PORT || 5000;
async function startServer() {
  try {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(` VMS Backend running on http://localhost:${PORT}`);
      console.log(`=============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
