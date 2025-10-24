const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Create tables if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    customerName TEXT,
    address TEXT,
    city TEXT,
    productName TEXT,
    modelNo TEXT,
    kw REAL,
    tankVolume REAL,
    qty INTEGER
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Editor', 'Viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS session (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp NOT NULL,
    PRIMARY KEY (sid)
  )
`);

// Auto-create admin user on startup (if not exists)
async function ensureAdminExists() {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role = 'Admin'");
    
    if (result.rows.length === 0) {
      console.log('🔄 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      
      await pool.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'Admin']
      );
      
      console.log('✅ Admin user created successfully!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📝 LOGIN CREDENTIALS:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Username: admin');
      console.log('Password: Admin@123456');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
      console.log('═══════════════════════════════════════════════════════════');
    } else {
      console.log('✅ Admin user already exists');
      console.log('Admin user details:', result.rows[0]);
    }
  } catch (err) {
    console.error('Error checking/creating admin user:', err.message);
  }
}

// Call ensureAdminExists after a short delay to ensure tables are created
setTimeout(ensureAdminExists, 1000);

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  console.log(`🔍 Auth check for ${req.path}`);
  console.log(`   Session ID: ${req.sessionID}`);
  console.log(`   User ID: ${req.session.userId}`);
  console.log(`   Username: ${req.session.username}`);
  
  if (req.session.userId) {
    console.log(`✅ Authenticated: ${req.session.username}`);
    next();
  } else {
    console.log(`❌ Not authenticated, redirecting to login`);
    res.redirect('/login');
  }
};

// Middleware to check role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (req.session.userId && roles.includes(req.session.role)) {
      next();
    } else {
      res.status(403).send('Access Denied');
    }
  };
};

// Routes
app.get('/login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.sendFile(__dirname + '/views/login.html');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log(`🔐 Login attempt for user: ${username}`);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).send('Invalid credentials');
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${username}, Role: ${user.role}`);
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`❌ Invalid password for user: ${username}`);
      return res.status(401).send('Invalid credentials');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    console.log(`✅ Session set for user: ${username}, Role: ${user.role}`);
    console.log(`📝 Session ID: ${req.sessionID}`);
    
    // Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      console.log(`✅ Login successful for user: ${username}`);
      console.log(`📝 Session saved with ID: ${req.sessionID}`);
      
      // Send response with proper headers
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ success: true, message: 'Login successful' });
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login');
  });
});

// Get current user info
app.get('/api/user-info', isAuthenticated, (req, res) => {
  res.json({
    userId: req.session.userId,
    username: req.session.username,
    role: req.session.role
  });
});

app.get('/admin-dashboard', isAuthenticated, hasRole(['Admin']), (req, res) => {
  res.sendFile(__dirname + '/views/admin-dashboard.html');
});

app.get('/', isAuthenticated, (req, res) => res.sendFile(__dirname + '/views/index.html'));
app.get('/filter', isAuthenticated, (req, res) => res.sendFile(__dirname + '/views/filter.html'));
app.get('/dashboard', isAuthenticated, (req, res) => res.sendFile(__dirname + '/views/dashboard.html'));
app.get('/all', isAuthenticated, (req, res) => res.sendFile(__dirname + '/views/all.html'));

// Add new entry (Editor and Admin only)
app.post('/add', isAuthenticated, hasRole(['Editor', 'Admin']), async (req, res) => {
  const { customerName, address, city, productName, modelNo, kw, tankVolume, qty } = req.body;
  await pool.query(
    `INSERT INTO entries (customerName, address, city, productName, modelNo, kw, tankVolume, qty)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [customerName, address, city, productName, modelNo, kw, tankVolume, qty]
  );
  res.redirect('/');
});

// Excel upload (Editor and Admin only)
const upload = multer({ dest: 'uploads/' });
app.post('/upload', isAuthenticated, hasRole(['Editor', 'Admin']), upload.single('excel'), async (req, res) => {
  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await pool.query(
      `INSERT INTO entries (customerName, address, city, productName, modelNo, kw, tankVolume, qty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [row['Customer Name'], row['Address'], row['City'], row['Product Name'], row['Model No'], row['KW'], row['Tank Volume'], row['Qty']]
    );
  }

  res.redirect('/');
});

// Filter API (All authenticated users)
app.get('/api/filter', isAuthenticated, async (req, res) => {
  const { column, value } = req.query;
  const result = await pool.query(`SELECT * FROM entries WHERE ${column} ILIKE $1`, [`%${value}%`]);
  res.json(result.rows);
});

// Dashboard API (All authenticated users)
app.get('/api/stats', isAuthenticated, async (req, res) => {
  const result = await pool.query(`SELECT city, SUM(qty) as totalQty FROM entries GROUP BY city`);
  res.json(result.rows);
});

// Add new column (Admin only)
app.post('/add-column', isAuthenticated, hasRole(['Admin']), async (req, res) => {
  const { columnName } = req.body;
  await pool.query(`ALTER TABLE entries ADD COLUMN ${columnName} TEXT`);
  res.redirect('/dashboard');
});

// Get all records (All authenticated users)
app.get('/api/all', isAuthenticated, async (req, res) => {
  const result = await pool.query(`SELECT * FROM entries`);
  res.json(result.rows);
});

// Edit record (Editor and Admin only)
app.post('/edit/:id', isAuthenticated, hasRole(['Editor', 'Admin']), async (req, res) => {
  const { customerName, address, city, productName, modelNo, kw, tankVolume, qty } = req.body;
  await pool.query(
    `UPDATE entries SET customerName=$1, address=$2, city=$3, productName=$4, modelNo=$5, kw=$6, tankVolume=$7, qty=$8 WHERE id=$9`,
    [customerName, address, city, productName, modelNo, kw, tankVolume, qty, req.params.id]
  );
  res.redirect('/all');
});

// Delete record (Editor and Admin only)
app.post('/delete/:id', isAuthenticated, hasRole(['Editor', 'Admin']), async (req, res) => {
  await pool.query(`DELETE FROM entries WHERE id=$1`, [req.params.id]);
  res.redirect('/all');
});

// Admin API routes
app.get('/api/users', isAuthenticated, hasRole(['Admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users/create', isAuthenticated, hasRole(['Admin']), async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // Check if admin already exists
    if (role === 'Admin') {
      const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'Admin'");
      if (adminCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Admin already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, role]
    );
    res.json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

app.post('/api/users/:id/role', isAuthenticated, hasRole(['Admin']), async (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;
  try {
    // Check if trying to create another admin
    if (role === 'Admin') {
      const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'Admin' AND id != $1", [userId]);
      if (adminCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Admin already exists' });
      }
    }

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    res.json({ success: true, message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.delete('/api/users/:id', isAuthenticated, hasRole(['Admin']), async (req, res) => {
  const userId = req.params.id;
  try {
    // Prevent deleting the current admin
    if (req.session.userId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Download Excel template
app.get('/download-template', isAuthenticated, (req, res) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([["Customer Name", "Address", "City", "Product Name", "Model No", "KW", "Tank Volume", "Qty"]]);
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  const filePath = path.join(__dirname, 'uploads/template.xlsx');
  xlsx.writeFile(wb, filePath);
  res.download(filePath);
});

// Export all to Excel
app.get('/export-excel', isAuthenticated, async (req, res) => {
  const result = await pool.query(`SELECT * FROM entries`);
  const ws = xlsx.utils.json_to_sheet(result.rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Entries");
  const filePath = path.join(__dirname, 'uploads/data.xlsx');
  xlsx.writeFile(wb, filePath);
  res.download(filePath);
});

// Export to PDF (supports filtering)
app.get('/export-pdf', isAuthenticated, async (req, res) => {
  const { column, value } = req.query;
  let query = 'SELECT * FROM entries';
  let params = [];

  if (column && value) {
    query += ` WHERE ${column} ILIKE $1`;
    params.push(`%${value}%`);
  }

  const result = await pool.query(query, params);
  const rows = result.rows;

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  const filePath = path.join(__dirname, 'uploads', 'data.pdf');
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const headers = ['S No', 'Customer Name', 'Address', 'City', 'Product Name', 'Model No', 'KW', 'Tank Volume', 'Qty'];
  const columnWidths = [40, 100, 100, 80, 100, 80, 50, 80, 40];
  const startX = 30;
  let y = 80;

  doc.fontSize(20).fillColor('#333').text('Entries Report', { align: 'center' });
  const timestamp = new Date().toLocaleString();
  doc.fontSize(10).fillColor('#666').text(`Generated on: ${timestamp}`, { align: 'right' });
  doc.moveDown(1.5);

  doc.rect(startX, y, columnWidths.reduce((a, b) => a + b, 0), 25).fill('#f0f0f0');

  let x = startX;
  headers.forEach((header, i) => {
    doc.rect(x, y, columnWidths[i], 25).stroke();
    doc.fillColor('#000').fontSize(10).text(header, x + 5, y + 7, {
      width: columnWidths[i] - 10,
      align: 'left'
    });
    x += columnWidths[i];
  });

  y += 25;

  rows.forEach((row, index) => {
    const values = [
      index + 1,
      row.customerName,
      row.address,
      row.city,
      row.productName,
      row.modelNo,
      row.kw,
      row.tankVolume,
      row.qty
    ];

    x = startX;
    values.forEach((val, i) => {
      doc.rect(x, y, columnWidths[i], 20).stroke();
      doc.fillColor('#000').fontSize(9).text(String(val), x + 5, y + 5, {
        width: columnWidths[i] - 10,
        align: 'left'
      });
      x += columnWidths[i];
    });

    y += 20;
    if (y > doc.page.height - 50) {
      doc.addPage({ layout: 'landscape' });
      y = 50;
    }
  });

  doc.end();

  stream.on('finish', () => res.download(filePath));
  stream.on('error', () => res.status(500).send('Failed to generate PDF'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});
