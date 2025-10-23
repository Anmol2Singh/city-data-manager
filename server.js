const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create table if not exists
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

// Routes
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));
app.get('/filter', (req, res) => res.sendFile(__dirname + '/views/filter.html'));
app.get('/dashboard', (req, res) => res.sendFile(__dirname + '/views/dashboard.html'));
app.get('/all', (req, res) => res.sendFile(__dirname + '/views/all.html'));

// Add new entry
app.post('/add', async (req, res) => {
  const { customerName, address, city, productName, modelNo, kw, tankVolume, qty } = req.body;
  await pool.query(
    `INSERT INTO entries (customerName, address, city, productName, modelNo, kw, tankVolume, qty)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [customerName, address, city, productName, modelNo, kw, tankVolume, qty]
  );
  res.redirect('/');
});

// Excel upload
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('excel'), async (req, res) => {
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

// Filter API
app.get('/api/filter', async (req, res) => {
  const { column, value } = req.query;
  const result = await pool.query(`SELECT * FROM entries WHERE ${column} ILIKE $1`, [`%${value}%`]);
  res.json(result.rows);
});

// Dashboard API
app.get('/api/stats', async (req, res) => {
  const result = await pool.query(`SELECT city, SUM(qty) as totalQty FROM entries GROUP BY city`);
  res.json(result.rows);
});

// Add new column
app.post('/add-column', async (req, res) => {
  const { columnName } = req.body;
  await pool.query(`ALTER TABLE entries ADD COLUMN ${columnName} TEXT`);
  res.redirect('/dashboard');
});

// Get all records
app.get('/api/all', async (req, res) => {
  const result = await pool.query(`SELECT * FROM entries`);
  res.json(result.rows);
});

// Edit record
app.post('/edit/:id', async (req, res) => {
  const { customerName, address, city, productName, modelNo, kw, tankVolume, qty } = req.body;
  await pool.query(
    `UPDATE entries SET customerName=$1, address=$2, city=$3, productName=$4, modelNo=$5, kw=$6, tankVolume=$7, qty=$8 WHERE id=$9`,
    [customerName, address, city, productName, modelNo, kw, tankVolume, qty, req.params.id]
  );
  res.redirect('/all');
});

// Delete record
app.post('/delete/:id', async (req, res) => {
  await pool.query(`DELETE FROM entries WHERE id=$1`, [req.params.id]);
  res.redirect('/all');
});

// Download Excel template
app.get('/download-template', (req, res) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([["Customer Name", "Address", "City", "Product Name", "Model No", "KW", "Tank Volume", "Qty"]]);
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  const filePath = path.join(__dirname, 'uploads/template.xlsx');
  xlsx.writeFile(wb, filePath);
  res.download(filePath);
});

// Export all to Excel
app.get('/export-excel', async (req, res) => {
  const result = await pool.query(`SELECT * FROM entries`);
  const ws = xlsx.utils.json_to_sheet(result.rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Entries");
  const filePath = path.join(__dirname, 'uploads/data.xlsx');
  xlsx.writeFile(wb, filePath);
  res.download(filePath);
});

// Export to PDF (supports filtering)
app.get('/export-pdf', async (req, res) => {
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
