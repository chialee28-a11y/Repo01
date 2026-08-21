import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './src/server/dataStore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req, res) => {
    const { email, googleId } = req.body;
    let user = dataStore.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register.' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Account is inactive. Contact Admin.' });
    }

    // Update last login
    user = dataStore.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    dataStore.addAuditLog({
      actionType: 'Login',
      performedByUserId: user.id,
      performedByName: user.name,
      performedByEmail: user.email,
      newValue: `User ${user.email} logged in via Google OAuth`,
    });

    res.json({ user });
  });

  // --- USERS ENDPOINTS ---
  app.get('/api/users', (req, res) => {
    res.json(dataStore.getUsers());
  });

  app.get('/api/users/:id', (req, res) => {
    const user = dataStore.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  app.post('/api/users/register', (req, res) => {
    try {
      const { name, email, googleId, departmentId, departmentName, role, avatarUrl } = req.body;
      if (!name || !email || !departmentId) {
        return res.status(400).json({ error: 'Name, email, and department are required' });
      }

      const existing = dataStore.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = dataStore.createUser({
        name,
        email,
        googleId: googleId || `goog_${Date.now()}`,
        departmentId,
        departmentName: departmentName || 'Department',
        role: role || 'Normal User',
        status: 'Active',
        avatarUrl,
      });

      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', (req, res) => {
    try {
      const { updates, performer } = req.body;
      const updated = dataStore.updateUser(req.params.id, updates || req.body, performer);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    try {
      dataStore.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- DEPARTMENTS ENDPOINTS ---
  app.get('/api/departments', (req, res) => {
    res.json(dataStore.getDepartments());
  });

  app.post('/api/departments', (req, res) => {
    try {
      const dept = dataStore.createDepartment(req.body);
      res.status(201).json(dept);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/departments/:id', (req, res) => {
    try {
      const updated = dataStore.updateDepartment(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/departments/:id', (req, res) => {
    try {
      dataStore.deleteDepartment(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- LEAVE REQUESTS ENDPOINTS ---
  app.get('/api/leave-requests', (req, res) => {
    const { userId, departmentId } = req.query;
    const records = dataStore.getLeaveRequests({
      userId: userId ? String(userId) : undefined,
      departmentId: departmentId ? String(departmentId) : undefined,
    });
    res.json(records);
  });

  app.post('/api/leave-requests', (req, res) => {
    try {
      const leave = dataStore.createLeaveRequest(req.body);
      res.status(201).json(leave);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/leave-requests/:id', (req, res) => {
    try {
      const { updates, reviewer } = req.body;
      const updated = dataStore.updateLeaveRequest(req.params.id, updates || req.body, reviewer);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- BRIEFING SESSIONS ENDPOINTS ---
  app.get('/api/briefing-sessions', (req, res) => {
    const { departmentId } = req.query;
    const sessions = dataStore.getBriefingSessions(departmentId ? String(departmentId) : undefined);
    res.json(sessions);
  });

  app.post('/api/briefing-sessions', (req, res) => {
    try {
      const session = dataStore.createBriefingSession(req.body);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/briefing-sessions/:id', (req, res) => {
    try {
      const updated = dataStore.updateBriefingSession(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/briefing-sessions/suggest-date/:departmentId', (req, res) => {
    const suggestion = dataStore.suggestNextBriefingDate(req.params.departmentId);
    res.json(suggestion);
  });

  // --- ATTENDANCE ENDPOINTS ---
  app.get('/api/briefing-sessions/:id/attendance', (req, res) => {
    const records = dataStore.getAttendanceRecords(req.params.id);
    const autoSuggestions = dataStore.getAutoOnLeaveSuggestions(req.params.id);
    res.json({ records, autoSuggestions });
  });

  app.post('/api/briefing-sessions/:id/attendance', (req, res) => {
    try {
      const { records, markedByUserId, markedByName } = req.body;
      const result = dataStore.saveAttendanceRecords(
        req.params.id,
        records,
        markedByUserId,
        markedByName
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/briefing-sessions/:id/summary', (req, res) => {
    try {
      const summary = dataStore.calculateAttendanceSummary(req.params.id);
      res.json(summary);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- NOTIFICATIONS & EMAILS ENDPOINTS ---
  app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    res.json(dataStore.getNotifications(userId ? String(userId) : undefined));
  });

  app.post('/api/notifications/mark-read', (req, res) => {
    const { notificationId } = req.body;
    dataStore.markNotificationRead(notificationId);
    res.json({ success: true });
  });

  app.post('/api/notifications/mark-all-read', (req, res) => {
    const { userId } = req.body;
    dataStore.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  app.get('/api/notification-templates', (req, res) => {
    res.json(dataStore.getNotificationTemplates());
  });

  app.put('/api/notification-templates/:id', (req, res) => {
    try {
      const updated = dataStore.updateNotificationTemplate(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/email-logs', (req, res) => {
    res.json(dataStore.getEmailLogs());
  });

  app.get('/api/audit-logs', (req, res) => {
    res.json(dataStore.getAuditLogs());
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LeavePlan & Attendance Hub Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
