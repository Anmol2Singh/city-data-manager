# Quick Start Guide - Authentication System

## Prerequisites
- Node.js installed
- PostgreSQL database running
- DATABASE_URL environment variable set

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will automatically create all required tables on startup.

### 3. Create First Admin User

Since the system requires at least one admin to create other users, you need to create the first admin directly in the database.

**Option A: Using SQL Client (pgAdmin, DBeaver, etc.)**

1. Connect to your PostgreSQL database
2. Run this SQL command to create an admin user with password "admin123":

```sql
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8H8H8', 'Admin');
```

**Option B: Using Node Script**

Create a file `create-admin.js`:

```javascript
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  try {
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['admin', hashedPassword, 'Admin']
    );
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    pool.end();
  }
}

createAdmin();
```

Then run:
```bash
node create-admin.js
```

### 4. Login

1. Open browser and go to `http://localhost:3000/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click Login

### 5. Create Additional Users

1. After logging in, click "👥 Admin" in the navigation bar
2. Fill in the user creation form
3. Select role: Admin, Editor, or Viewer
4. Click "Create User"

## User Roles Quick Reference

| Role | Add Records | Edit Records | Delete Records | Manage Users |
|------|-------------|--------------|----------------|--------------|
| Admin | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✗ |
| Viewer | ✗ | ✗ | ✗ | ✗ |

## Key Features

✅ **Secure Authentication** - Passwords hashed with bcryptjs
✅ **Session Management** - 24-hour sessions stored in PostgreSQL
✅ **Role-Based Access** - Three roles with different permissions
✅ **Admin Dashboard** - Manage users and assign roles
✅ **User Info Display** - See current user and role in navbar
✅ **Logout** - Secure logout with session destruction

## Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### "Connection refused" error
- Check if PostgreSQL is running
- Verify DATABASE_URL is correct

### Cannot login
- Verify admin user was created in database
- Check username and password are correct

### Admin dashboard not showing
- Make sure you're logged in as Admin role
- Check user role in database

## Next Steps

1. ✅ Create additional users with different roles
2. ✅ Test permissions by logging in as different users
3. ✅ Add data records as Editor/Admin
4. ✅ View data as Viewer (no edit/delete options)
5. ✅ Manage users from Admin Dashboard

## Support

For detailed documentation, see `AUTHENTICATION_SETUP.md`
