# Admin Setup for Render Deployment

## Quick Start for Render

This guide explains how to create admin credentials for your Render deployment.

## Admin Credentials for Render

```
Username: admin
Password: Admin@123456
```

⚠️ **IMPORTANT:** Change this password after first login!

## Method 1: Using Render Shell (Recommended)

### Steps:

1. **Go to Render Dashboard**
   - Navigate to https://dashboard.render.com
   - Select your web service

2. **Open Shell**
   - Click "Shell" tab at the top

3. **Run the Admin Creation Script**
   ```bash
   node create-admin-render.js
   ```

4. **Expected Output:**
   ```
   ✅ Admin user created successfully!
   ═══════════════════════════════════════════════════════════
   📝 LOGIN CREDENTIALS:
   ═══════════════════════════════════════════════════════════
   Username: admin
   Password: Admin@123456
   ═══════════════════════════════════════════════════════════
   ```

5. **Login to Your App**
   - Go to: `https://your-app-name.onrender.com/login`
   - Username: `admin`
   - Password: `Admin@123456`

---

## Method 2: Using PostgreSQL Console

### Steps:

1. **Go to Render Dashboard**
   - Select your PostgreSQL database

2. **Click "Connect"**
   - Copy the connection string

3. **Connect Using psql or DBeaver**
   ```bash
   psql postgresql://user:password@host:5432/database
   ```

4. **Run SQL Command**
   ```sql
   INSERT INTO users (username, password, role) 
   VALUES ('admin', '$2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8H8H8', 'Admin');
   ```

5. **Login**
   - Go to: `https://your-app-name.onrender.com/login`
   - Username: `admin`
   - Password: `admin123`

---

## Method 3: Using Environment Variable

### For Render Free Plan:

1. **In Render Dashboard → Web Service → Shell:**

```bash
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});
(async () => {
  try {
    const hash = await bcrypt.hash('Admin@123456', 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES (\$1, \$2, \$3)', 
      ['admin', hash, 'Admin']
    );
    console.log('✅ Admin created: admin / Admin@123456');
  } catch (err) {
    console.log('⚠️ Admin may already exist or error:', err.message);
  }
  process.exit(0);
})();
"
```

---

## After Creating Admin

### 1. First Login
- URL: `https://your-app-name.onrender.com/login`
- Username: `admin`
- Password: `Admin@123456`

### 2. Change Password (Recommended)
- Currently, you need to delete and recreate the user to change password
- Future enhancement: Add password change feature

### 3. Create Additional Users
1. Click "👥 Admin" in navbar
2. Fill user creation form:
   - Username
   - Password
   - Role: Admin / Editor / Viewer
3. Click "Create User"

---

## User Roles

### Admin
- Create users
- Manage user roles
- Delete users
- Add/edit/delete records
- Upload Excel
- View all data
- Access admin dashboard

### Editor
- Add records
- Edit records
- Delete records
- Upload Excel
- View all data

### Viewer
- View records
- Filter records
- View dashboard
- Download/export data

---

## Troubleshooting

### Error: "Admin user already exists"
- Admin is already created
- Use existing credentials: `admin` / `Admin@123456`
- Or delete the user and recreate

### Error: "Connection refused"
- Verify DATABASE_URL is set in Render environment
- Check PostgreSQL database is running
- Verify database credentials

### Cannot login after creating admin
- Wait a few seconds for database to sync
- Clear browser cache
- Try incognito/private window
- Verify credentials are correct

### Forgot admin password
1. Go to Render Shell
2. Delete admin user:
   ```bash
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ 
     connectionString: process.env.DATABASE_URL, 
     ssl: { rejectUnauthorized: false } 
   });
   (async () => {
     await pool.query('DELETE FROM users WHERE username = \$1', ['admin']);
     console.log('Admin user deleted');
     process.exit(0);
   })();
   "
   ```
3. Recreate admin using one of the methods above

---

## Security Best Practices

✅ **Change Default Password**
- Change `Admin@123456` after first login
- Use a strong, unique password

✅ **Limit Admin Access**
- Only 1 admin account allowed
- Keep admin credentials secure
- Don't share with others

✅ **Monitor Users**
- Review user list regularly
- Delete unused accounts
- Check user activities

✅ **Database Security**
- Use strong database password
- Enable SSL connections (Render does this by default)
- Regular backups (Render handles this)

---

## Free Plan Considerations

### Limitations:
- Free tier may have cold starts (app takes time to wake up)
- Limited resources (0.5 CPU, 512MB RAM)
- No custom domain (unless you add one)

### Recommendations:
- Use free plan for testing/development
- Upgrade to paid plan for production
- Monitor resource usage
- Set up alerts for errors

---

## Files Included

- `create-admin-render.js` - Script for Render deployment
- `create-admin.js` - Script for local development
- `docs/CREATE_CREDENTIALS.md` - General credentials guide
- `docs/RENDER_DEPLOYMENT.md` - Full Render deployment guide

---

## Quick Reference

| Task | Command |
|------|---------|
| Create admin (Render Shell) | `node create-admin-render.js` |
| Create admin (Local) | `node create-admin.js` |
| Login URL | `https://your-app.onrender.com/login` |
| Admin username | `admin` |
| Admin password | `Admin@123456` |

---

## Support

For more information:
- `docs/RENDER_DEPLOYMENT.md` - Complete Render guide
- `docs/CREATE_CREDENTIALS.md` - Credentials guide
- `docs/QUICK_START.md` - Quick setup
- Render Documentation: https://render.com/docs

---

**Last Updated:** October 24, 2025
**Status:** ✅ Ready for Render Deployment
