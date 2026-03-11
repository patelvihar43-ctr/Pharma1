import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initial data to use as fallback
const getInitialData = () => ({
  users: [
    { id: 1, username: 'emp1', password: 'pass123', full_name: 'John Doe', employee_id: 'EMP001', department: 'Production', designation: 'Officer', ext_no: '101', role: 'EMPLOYEE' },
    { id: 2, username: 'hod1', password: 'pass123', full_name: 'Robert Smith', employee_id: 'HOD001', department: 'Production', designation: 'Manager', ext_no: '201', role: 'HOD' },
    { id: 3, username: 'qa1', password: 'pass123', full_name: 'Alice Johnson', employee_id: 'QA001', department: 'Quality Assurance', designation: 'QA Lead', ext_no: '301', role: 'QA' },
    { id: 4, username: 'it1', password: 'pass123', full_name: 'Mike Wilson', employee_id: 'IT001', department: 'IT', designation: 'System Admin', ext_no: '401', role: 'IT_ADMIN' },
    { id: 5, username: 'admin', password: 'admin123', full_name: 'Super Admin', employee_id: 'ADM001', department: 'IT', designation: 'IT Head', ext_no: '999', role: 'SUPER_ADMIN' }
  ],
  requests: [],
  audit_logs: [],
  master_data: [
    { id: 1, type: 'SOFTWARE', value: 'SAP S/4HANA' },
    { id: 2, type: 'SOFTWARE', value: 'LIMS' },
    { id: 3, type: 'SOFTWARE', value: 'Empower 3' },
    { id: 4, type: 'SOFTWARE', value: 'Chromeleon' },
    { id: 5, type: 'INSTRUMENT', value: 'HPLC-01' },
    { id: 6, type: 'INSTRUMENT', value: 'GC-05' },
    { id: 7, type: 'INSTRUMENT', value: 'UV-02' },
    { id: 8, type: 'INSTRUMENT', value: 'FTIR-01' },
    { id: 9, type: 'DEPARTMENT', value: 'Production' },
    { id: 10, type: 'DEPARTMENT', value: 'QA' },
    { id: 11, type: 'DEPARTMENT', value: 'QC' },
    { id: 12, type: 'DEPARTMENT', value: 'R&D' },
    { id: 13, type: 'DEPARTMENT', value: 'IT' },
    { id: 14, type: 'DEPARTMENT', value: 'HR' }
  ],
  user_hod_mapping: [
    { employee_id: 1, hod_id: 2 }
  ],
  notifications: []
});

let memoryData: any = null;

// Helper to read data from JSON file
const readData = () => {
  if (memoryData) return memoryData;

  try {
    console.log('Attempting to read data from:', DATA_FILE);
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      if (content && content.trim()) {
        memoryData = JSON.parse(content);
        console.log('Data loaded successfully from file');
        return memoryData;
      }
    } else {
      console.log('Data file does not exist at:', DATA_FILE);
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  
  console.log('Using initial fallback data');
  memoryData = getInitialData();
  return memoryData;
};

// Helper to write data to JSON file
const writeData = (data: any) => {
  memoryData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Expected on Vercel due to read-only filesystem
    console.warn('Could not write to data file (expected on Vercel):', err);
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'pharma-flow-secret-key';

// Middleware to authenticate JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Initialize Data
const initData = () => {
  const data = readData();
  if (!data.users || data.users.length === 0) {
    writeData(getInitialData());
  }
};

initData();

export const app = express();
app.use(express.json());

// --- Auth Endpoints ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const data = readData();
    const user = data.users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      const { password, ...userWithoutPass } = user;
      const token = jwt.sign(userWithoutPass, JWT_SECRET, { expiresIn: '24h' });
      
      // Log Login Event
      const newLog = {
        id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
        user_id: user.id,
        action: 'LOGIN',
        timestamp: new Date().toISOString(),
        ip_address: req.ip,
        details: 'User logged in'
      };
      data.audit_logs.push(newLog);
      writeData(data);

      res.json({ user: userWithoutPass, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'System error', 
      details: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined 
    });
  }
});

app.get('/api/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

app.post('/api/logout', authenticateToken, (req: any, res) => {
  const { id: userId } = req.user;
  const data = readData();
  
  const newLog = {
    id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
    user_id: userId,
    action: 'LOGOUT',
    timestamp: new Date().toISOString(),
    ip_address: req.ip,
    details: 'User logged out'
  };
  data.audit_logs.push(newLog);
  writeData(data);
  
  res.json({ success: true });
});

app.post('/api/audit-logs/event', authenticateToken, (req: any, res) => {
  const { id: userId } = req.user;
  const { action, details, path, element } = req.body;
  const data = readData();

  const newLog = {
    id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
    user_id: userId,
    action: action || 'CLICK',
    timestamp: new Date().toISOString(),
    ip_address: req.ip,
    details: details || `Clicked on ${element} at ${path}`,
    path,
    element
  };
  data.audit_logs.push(newLog);
  writeData(data);
  
  res.json({ success: true });
});

// --- Request Endpoints ---
app.get('/api/requests', authenticateToken, (req: any, res) => {
  const { id: userId, role, department } = req.user;
  const data = readData();
  let requests = data.requests.map((r: any) => {
    const user = data.users.find((u: any) => u.id === r.user_id);
    return { ...r, employee_name: user ? user.full_name : 'Unknown' };
  });

  if (role === 'EMPLOYEE') {
    requests = requests.filter((r: any) => r.user_id === userId);
  } else if (role === 'HOD') {
    requests = requests.filter((r: any) => {
      const user = data.users.find((u: any) => u.id === r.user_id);
      return user && user.department === department;
    });
  }
  // QA, IT, SUPER_ADMIN see all
  res.json(requests);
});

app.get('/api/requests/:id', authenticateToken, (req, res) => {
  const data = readData();
  const requestId = parseInt(req.params.id);
  const request = data.requests.find((r: any) => r.id === requestId);
  
  if (request) {
    const user = data.users.find((u: any) => u.id === request.user_id);
    const requestWithUser = {
      ...request,
      employee_name: user?.full_name,
      employee_id: user?.employee_id,
      department: user?.department,
      designation: user?.designation,
      ext_no: user?.ext_no
    };

    const logs = data.audit_logs
      .filter((al: any) => al.request_id === requestId)
      .map((al: any) => {
        const logUser = data.users.find((u: any) => u.id === al.user_id);
        return {
          ...al,
          full_name: logUser?.full_name,
          role: logUser?.role,
          designation: logUser?.designation
        };
      })
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    requestWithUser.audit_logs = logs;
    res.json(requestWithUser);
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

app.post('/api/requests', authenticateToken, (req, res) => {
  const { userId, category, formData } = req.body;
  const data = readData();
  
  let status = 'SUBMITTED_PENDING_HOD';
  if (category === 'PASSWORD') {
    status = 'APPROVED_PENDING_IT';
  }

  const newRequest = {
    id: data.requests.length > 0 ? Math.max(...data.requests.map((r: any) => r.id)) + 1 : 1,
    user_id: userId,
    category,
    status,
    form_data: JSON.stringify(formData),
    submission_date: new Date().toISOString(),
    last_updated: new Date().toISOString()
  };

  data.requests.push(newRequest);
  
  // Log Audit
  const newLog = {
    id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
    request_id: newRequest.id,
    user_id: userId,
    action: 'SUBMITTED',
    timestamp: new Date().toISOString(),
    ip_address: req.ip
  };
  data.audit_logs.push(newLog);

  writeData(data);
  res.json({ id: newRequest.id });
});

app.post('/api/requests/:id/approve', authenticateToken, (req, res) => {
  const { id } = req.params;
  const requestId = parseInt(id);
  const { userId, role, password, itClosureData } = req.body;
  const data = readData();

  // Verify Confirmation
  const user = data.users.find((u: any) => u.id === userId && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid password' });

  const requestIndex = data.requests.findIndex((r: any) => r.id === requestId);
  if (requestIndex === -1) return res.status(404).json({ error: 'Request not found' });

  const request = data.requests[requestIndex];
  let nextStatus = request.status;

  if (role === 'HOD' && request.status === 'SUBMITTED_PENDING_HOD') {
    nextStatus = 'APPROVED_PENDING_QA';
  } else if (role === 'QA' && request.status === 'APPROVED_PENDING_QA') {
    nextStatus = 'APPROVED_PENDING_IT';
  } else if (role === 'IT_ADMIN' && request.status === 'APPROVED_PENDING_IT') {
    nextStatus = 'COMPLETED';
    if (itClosureData) {
      data.requests[requestIndex].it_closure_data = JSON.stringify(itClosureData);
    }
  }

  data.requests[requestIndex].status = nextStatus;
  data.requests[requestIndex].last_updated = new Date().toISOString();

  const newLog = {
    id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
    request_id: requestId,
    user_id: userId,
    action: `${role}_APPROVED`,
    timestamp: new Date().toISOString(),
    ip_address: req.ip
  };
  data.audit_logs.push(newLog);

  writeData(data);
  res.json({ success: true, status: nextStatus });
});

app.post('/api/requests/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  const requestId = parseInt(id);
  const { userId, role, reason, password } = req.body;
  const data = readData();

  // Verify Confirmation
  const user = data.users.find((u: any) => u.id === userId && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid password' });

  const requestIndex = data.requests.findIndex((r: any) => r.id === requestId);
  if (requestIndex === -1) return res.status(404).json({ error: 'Request not found' });

  data.requests[requestIndex].status = "REJECTED";
  data.requests[requestIndex].rejection_reason = reason;
  data.requests[requestIndex].last_updated = new Date().toISOString();

  const newLog = {
    id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
    request_id: requestId,
    user_id: userId,
    action: `${role}_REJECTED`,
    timestamp: new Date().toISOString(),
    ip_address: req.ip,
    justification: reason
  };
  data.audit_logs.push(newLog);

  writeData(data);
  res.json({ success: true });
});

app.get('/api/master-data', authenticateToken, (req, res) => {
  const data = readData();
  res.json(data.master_data);
});

// --- Notification Endpoints ---
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const { id: userId } = req.user;
  const data = readData();
  const userNotifications = (data.notifications || [])
    .filter((n: any) => n.user_id === userId)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(userNotifications);
});

app.post('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const notificationId = parseInt(id);
  const data = readData();
  const index = data.notifications.findIndex((n: any) => n.id === notificationId);
  if (index !== -1) {
    data.notifications[index].read = true;
    writeData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// --- Expiry Check Logic ---
const checkExpiries = () => {
  const data = readData();
  const now = new Date();
  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(now.getDate() + 10);

  data.requests.forEach((request: any) => {
    if (request.status !== 'COMPLETED') return;

    const formData = JSON.parse(request.form_data);
    if (formData.empStatus === 'Temporary' && formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 10 && diffDays > 0) {
          const user = data.users.find((u: any) => u.id === request.user_id);
          const userName = user ? user.full_name : 'Unknown User';

          // Users to notify: The owner, all Employees, and all IT Admins
          const targetUsers = data.users.filter((u: any) => 
            u.id === request.user_id || // The owner
            u.role === 'EMPLOYEE' ||    // All employees
            u.role === 'IT_ADMIN' ||    // IT Admins
            u.role === 'SUPER_ADMIN'    // Super Admins
          );

          targetUsers.forEach((target: any) => {
            const alreadyNotified = data.notifications.some(
              (n: any) => n.request_id === request.id && n.user_id === target.id && n.type === 'EXPIRY_WARNING'
            );

            if (!alreadyNotified) {
              const isOwner = target.id === request.user_id;
              const message = isOwner 
                ? `Your temporary account for ${request.category} (Request #${request.id}) will expire in ${diffDays} days on ${formData.expiryDate}.`
                : `Temporary account for ${userName} (${request.category}, Request #${request.id}) will expire in ${diffDays} days on ${formData.expiryDate}.`;

              const newNotification = {
                id: data.notifications.length > 0 ? Math.max(...data.notifications.map((n: any) => n.id)) + 1 : 1,
                user_id: target.id,
                request_id: request.id,
                type: 'EXPIRY_WARNING',
                message,
                timestamp: new Date().toISOString(),
                read: false
              };
              data.notifications.push(newNotification);
              
              if (isOwner) {
                console.log(`[EMAIL SENT] To: User ID ${target.id}, Subject: Account Expiry Warning, Message: ${message}`);
              }
            }
          });

          // Log Audit (only once per request expiry check)
          const auditLogged = data.audit_logs.some(
            (l: any) => l.request_id === request.id && l.action === 'EXPIRY_NOTIFICATION_SENT'
          );

          if (!auditLogged) {
            const newLog = {
              id: data.audit_logs.length > 0 ? Math.max(...data.audit_logs.map((l: any) => l.id)) + 1 : 1,
              request_id: request.id,
              user_id: 0, // System
              action: 'EXPIRY_NOTIFICATION_SENT',
              timestamp: new Date().toISOString(),
              ip_address: 'SYSTEM',
              details: `Expiry notifications sent for Request #${request.id} to owner, employees, and IT.`
            };
            data.audit_logs.push(newLog);
          }
        }
    }
  });

  writeData(data);
};

// Check expiries every hour
setInterval(checkExpiries, 3600000);
// Also check on start
setTimeout(checkExpiries, 5000);

// --- Admin Endpoints ---
app.get('/api/admin/users', authenticateToken, (req: any, res) => {
  const { role } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(role)) return res.sendStatus(403);
  const data = readData();
  const users = data.users.map(({ password, ...u }: any) => u);
  res.json(users);
});

app.post('/api/admin/users', authenticateToken, (req: any, res) => {
  const { role: userRole } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)) return res.sendStatus(403);
  const { username, password, full_name, employee_id, department, designation, ext_no, role } = req.body;
  const data = readData();
  
  if (data.users.some((u: any) => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: data.users.length > 0 ? Math.max(...data.users.map((u: any) => u.id)) + 1 : 1,
    username,
    password,
    full_name,
    employee_id,
    department,
    designation,
    ext_no,
    role
  };

  data.users.push(newUser);
  writeData(data);
  res.json({ id: newUser.id });
});

app.put('/api/admin/users/:id', authenticateToken, (req: any, res) => {
  const { role: userRole } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)) return res.sendStatus(403);
  const { id } = req.params;
  const userId = parseInt(id);
  const { full_name, department, designation, ext_no, role } = req.body;
  const data = readData();
  
  const userIndex = data.users.findIndex((u: any) => u.id === userId);
  if (userIndex !== -1) {
    data.users[userIndex] = { ...data.users[userIndex], full_name, department, designation, ext_no, role };
    writeData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, (req: any, res) => {
  const { role: userRole } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)) return res.sendStatus(403);
  const userId = parseInt(req.params.id);
  const data = readData();
  data.users = data.users.filter((u: any) => u.id !== userId);
  writeData(data);
  res.json({ success: true });
});

app.post('/api/admin/master-data', authenticateToken, (req: any, res) => {
  const { role: userRole } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)) return res.sendStatus(403);
  const { type, value } = req.body;
  const data = readData();
  const newItem = {
    id: data.master_data.length > 0 ? Math.max(...data.master_data.map((m: any) => m.id)) + 1 : 1,
    type,
    value
  };
  data.master_data.push(newItem);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/admin/master-data/:id', authenticateToken, (req: any, res) => {
  const { role: userRole } = req.user;
  if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)) return res.sendStatus(403);
  const itemId = parseInt(req.params.id);
  const data = readData();
  data.master_data = data.master_data.filter((m: any) => m.id !== itemId);
  writeData(data);
  res.json({ success: true });
});

app.get('/api/admin/audit-logs', authenticateToken, (req: any, res) => {
  const { id: userId, role } = req.user;
  const data = readData();
  
  let filteredLogs = data.audit_logs;
  
  // If not Admin or QA, only show their own logs
  if (!['SUPER_ADMIN', 'IT_ADMIN', 'QA'].includes(role)) {
    filteredLogs = filteredLogs.filter((al: any) => al.user_id === userId);
  }

  const logs = filteredLogs.map((al: any) => {
    const user = data.users.find((u: any) => u.id === al.user_id);
    const request = data.requests.find((r: any) => r.id === al.request_id);
    return {
      ...al,
      full_name: user?.full_name,
      category: request?.category
    };
  }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(logs);
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Not Found');
        }
      });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
