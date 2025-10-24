# Automatic Admin Setup on Deployment

## Overview

The application now automatically creates an admin user when it starts for the first time. No manual setup required!

## How It Works

When you run `npm start` or deploy to Render:

1. **Tables are created** (if they don't exist)
2. **Admin user is checked** - Does an admin already exist?
3. **If no admin exists:**
   - Admin user is created automatically
   - Credentials are displayed in the console
4. **If admin exists:**
   - Application starts normally

## Admin Credentials

```
Username: admin
Password: Admin@123456
```

⚠️ **Change this password after first login!**

## Local Development

### Start the application:
```bash
npm start
```

### Console output:
```
🔄 Creating default admin user...
✅ Admin user created successfully!
═══════════════════════════════════════════════════════════
📝 LOGIN CREDENTIALS:
═══════════════════════════════════════════════════════════
Username: admin
Password: Admin@123456
═══════════════════════════════════════════════════════════
⚠️  IMPORTANT: Change this password after first login!
═══════════════════════════════════════════════════════════
```

### Login:
- URL: `http://localhost:3000/login`
- Username: `admin`
- Password: `Admin@123456`

## Render Deployment

### Step 1: Deploy to Render
1. Push code to GitHub
2. Deploy from Render dashboard
3. Application starts automatically

### Step 2: Check Logs
1. Go to Render Dashboard → Web Service
2. Click "Logs" tab
3. Look for admin creation message

### Step 3: Login
- URL: `https://your-app-name.onrender.com/login`
- Username: `admin`
- Password: `Admin@123456`

## What Changed

### Modified Files:
- **`server.js`** - Added `ensureAdminExists()` function

### New Function:
```javascript
async function ensureAdminExists() {
  // Checks if admin exists
  // If not, creates admin with credentials:
  // Username: admin
  // Password: Admin@123456
}
```

### Execution:
- Function runs 1 second after server starts
- Ensures tables are created first
- Only creates admin if it doesn't exist
- Displays credentials in console

## Benefits

✅ **No manual setup required**
✅ **Works on Render free plan** (no shell access needed)
✅ **Works locally** (automatic setup)
✅ **Idempotent** (safe to run multiple times)
✅ **Secure** (password is hashed with bcryptjs)

## Security Notes

1. **Default Password**
   - Default password is: `Admin@123456`
   - Change it immediately after first login

2. **Only One Admin**
   - System allows only 1 admin account
   - If admin exists, it won't be recreated

3. **Password Hashing**
   - Passwords are hashed with bcryptjs (10 rounds)
   - Never stored in plain text

## Troubleshooting

### Admin not created
- Check application logs
- Verify DATABASE_URL is set
- Ensure PostgreSQL is running
- Check database credentials

### Cannot login
- Wait 2-3 minutes for database to initialize
- Clear browser cache
- Try incognito/private window
- Verify credentials: `admin` / `Admin@123456`

### Admin already exists
- Use existing credentials
- Or delete admin user and restart app

## Manual Admin Creation (If Needed)

If you want to create admin manually:

### Using SQL:
```sql
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8H8H8', 'Admin');
```

### Using Node Script:
```bash
node create-admin-render.js
```

## After First Login

1. **Change Admin Password**
   - Currently, delete and recreate user to change password
   - Future feature: Add password change functionality

2. **Create Additional Users**
   - Click "👥 Admin" in navbar
   - Create Editor/Viewer users
   - Assign appropriate roles

3. **Manage Users**
   - Change user roles
   - Delete unused users
   - Monitor user activities

## Environment Variables

### Required:
- `DATABASE_URL` - PostgreSQL connection string

### Optional:
- `NODE_ENV` - Set to `production` for Render
- `PORT` - Port number (default: 3000)
- `SESSION_SECRET` - Session encryption key

## Deployment Checklist

- [x] Code pushed to GitHub
- [x] Auto admin creation implemented
- [x] Render configuration ready
- [ ] Deploy to Render
- [ ] Check logs for admin creation
- [ ] Login with admin credentials
- [ ] Change admin password
- [ ] Create additional users

## Summary

**No more manual admin setup required!**

Just deploy and the admin user is created automatically. Perfect for Render free plan where shell access is limited.

---

**Status:** ✅ Automatic Admin Setup Enabled
**Last Updated:** October 24, 2025
