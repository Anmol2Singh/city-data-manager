# How to Create Admin & User Credentials

## Overview

This guide explains how to create admin and user credentials for the City Data Manager application.

## Prerequisites

- PostgreSQL database running
- Application server running (`npm start`)
- Node.js installed (for script method)

## Step 1: Create First Admin User

Since the system requires at least one admin to create other users, you must create the first admin directly in the database.

### Method A: Using SQL Client (Recommended for Beginners)

**Tools:** pgAdmin, DBeaver, or any PostgreSQL client

**Steps:**

1. **Connect to your PostgreSQL database**
   - Host: localhost (or your database host)
   - Port: 5432
   - Database: city_data_manager
   - Username: city_data_user
   - Password: (your database password)

2. **Run this SQL command:**

```sql
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8H8H8', 'Admin');
```

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

### Method B: Using Node Script (Recommended for Developers)

**Steps:**

1. **Create a file named `create-admin.js` in your project root:**

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
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    pool.end();
  }
}

createAdmin();
```

2. **Run the script:**

```bash
node create-admin.js
```

3. **Expected Output:**

```
✅ Admin user created successfully!
Username: admin
Password: admin123
```

### Method C: Using Render Shell (For Render Deployment)

**Steps:**

1. Go to your Render dashboard
2. Select your web service
3. Click "Shell" tab
4. Run this command:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query('INSERT INTO users (username, password, role) VALUES (\$1, \$2, \$3)', ['admin', hash, 'Admin']);
  console.log('Admin created: admin / admin123');
  process.exit(0);
})();
"
```

## Step 2: Login with Admin Credentials

1. **Open your browser and navigate to:**
   ```
   http://localhost:3000/login
   ```

2. **Enter credentials:**
   - Username: `admin`
   - Password: `admin123`

3. **Click Login**

4. **You should be redirected to the home page**

## Step 3: Create Additional Users (As Admin)

Once logged in as admin, you can create other users from the Admin Dashboard.

### Via Admin Dashboard:

1. **Click "👥 Admin" in the navigation bar**
2. **Fill in the user creation form:**
   - **Username:** Enter a unique username
   - **Password:** Enter a secure password
   - **Role:** Select one of:
     - **Admin** - Full access (⚠️ Only 1 admin allowed)
     - **Editor** - Can add/edit/delete records
     - **Viewer** - Read-only access

3. **Click "Create User"**

4. **User is created successfully!**

## User Roles & Permissions

### Admin
```
✓ Create users
✓ Manage user roles
✓ Delete users
✓ Add records
✓ Edit records
✓ Delete records
✓ Upload Excel
✓ View all data
✓ Access admin dashboard
```

### Editor
```
✓ Add records
✓ Edit records
✓ Delete records
✓ Upload Excel
✓ View all data
✗ Manage users
```

### Viewer
```
✓ View records
✓ Filter records
✓ View dashboard
✓ Download/export data
✗ Add records
✗ Edit records
✗ Delete records
✗ Upload files
```

## Creating Custom Credentials

### Create Admin with Custom Password

**Using SQL:**

```sql
-- First, generate a bcrypt hash of your password
-- You can use an online bcrypt generator or Node.js

-- Then insert:
INSERT INTO users (username, password, role) 
VALUES ('your_admin_username', '$2a$10$YOUR_BCRYPT_HASH_HERE', 'Admin');
```

**Using Node Script:**

```javascript
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function createCustomAdmin() {
  const username = 'your_admin_username';
  const password = 'your_secure_password';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, 'Admin']
    );
    console.log(`✅ Admin user '${username}' created successfully!`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    pool.end();
  }
}

createCustomAdmin();
```

### Create Editor User

**Via Admin Dashboard:**

1. Login as Admin
2. Click "👥 Admin"
3. Fill form with:
   - Username: `editor1`
   - Password: `editor_password`
   - Role: `Editor`
4. Click "Create User"

### Create Viewer User

**Via Admin Dashboard:**

1. Login as Admin
2. Click "👥 Admin"
3. Fill form with:
   - Username: `viewer1`
   - Password: `viewer_password`
   - Role: `Viewer`
4. Click "Create User"

## Changing User Passwords

Currently, users cannot change their own passwords. To change a user's password:

1. **Delete the user** from Admin Dashboard
2. **Create a new user** with the same username and new password

## Resetting Admin Password

If you forget the admin password:

1. **Delete the admin user from database:**

```sql
DELETE FROM users WHERE username = 'admin';
```

2. **Create a new admin user** using one of the methods above

## Security Best Practices

✅ **Use Strong Passwords**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words

✅ **Change Default Credentials**
- Change admin password immediately after first login
- Don't share credentials

✅ **Limit Admin Access**
- Only 1 admin account allowed
- Keep admin credentials secure

✅ **Regular Audits**
- Review user list regularly
- Delete unused accounts
- Monitor user activities

## Troubleshooting

### Error: "Username already exists"
- Choose a different username
- Check if user already exists in database

### Error: "Connection refused"
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database credentials

### Cannot login after creating user
- Verify user was created in database
- Check username and password are correct
- Clear browser cache and try again

### Only 1 admin allowed error
- You already have an admin user
- Delete existing admin if needed
- Or create Editor/Viewer instead

## Database Query Examples

### View all users:
```sql
SELECT id, username, role, created_at FROM users ORDER BY created_at DESC;
```

### View specific user:
```sql
SELECT * FROM users WHERE username = 'admin';
```

### Update user role:
```sql
UPDATE users SET role = 'Editor' WHERE username = 'editor1';
```

### Delete user:
```sql
DELETE FROM users WHERE username = 'viewer1';
```

## Summary

| Task | Method | Difficulty |
|------|--------|------------|
| Create first admin | SQL or Node script | Easy |
| Login | Web browser | Easy |
| Create other users | Admin Dashboard | Easy |
| Change password | Delete & recreate | Medium |
| Reset admin | SQL delete + recreate | Medium |

---

**For more information, see:**
- `docs/QUICK_START.md` - Quick setup guide
- `docs/AUTHENTICATION_SETUP.md` - Detailed auth setup
- `docs/README.md` - Documentation index
