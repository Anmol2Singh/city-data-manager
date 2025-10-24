# Deployment Checklist - Authentication System

## Pre-Deployment Setup

### 1. Dependencies Installation
- [ ] Run `npm install` to install all dependencies
- [ ] Verify bcryptjs installed: `npm list bcryptjs`
- [ ] Verify express-session installed: `npm list express-session`
- [ ] Verify connect-pg-simple installed: `npm list connect-pg-simple`

### 2. Database Setup
- [ ] PostgreSQL server is running
- [ ] DATABASE_URL environment variable is set
- [ ] Test database connection
- [ ] Verify tables will be auto-created on first run

### 3. Environment Configuration
- [ ] Set DATABASE_URL environment variable
- [ ] Set SESSION_SECRET environment variable (change from default)
- [ ] Set PORT if needed (default: 3000)
- [ ] For production: Enable HTTPS/SSL

### 4. Create Initial Admin User
- [ ] Choose method (SQL or Node script)
- [ ] Create admin user with secure password
- [ ] Verify admin user in database
- [ ] Test login with admin credentials

## Testing Checklist

### Authentication Tests
- [ ] Login page loads at `/login`
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password fails
- [ ] Login with non-existent user fails
- [ ] Session created after successful login
- [ ] Logout destroys session
- [ ] Accessing protected routes without login redirects to login
- [ ] Session persists across page refreshes
- [ ] Session expires after 24 hours

### Authorization Tests
- [ ] Admin can access all routes
- [ ] Editor can access data routes but not admin routes
- [ ] Viewer can only view data, not edit/delete
- [ ] Viewer cannot see edit/delete buttons
- [ ] Viewer cannot access admin dashboard
- [ ] Backend returns 403 for unauthorized access

### Admin Dashboard Tests
- [ ] Admin can access `/admin-dashboard`
- [ ] Admin can create new users
- [ ] Admin can assign roles (Admin, Editor, Viewer)
- [ ] Admin can change user roles
- [ ] Admin can delete users
- [ ] Cannot create duplicate usernames
- [ ] Cannot create second admin
- [ ] Cannot delete own admin account
- [ ] User list updates in real-time

### Data Operations Tests
- [ ] Editor can add records
- [ ] Editor can edit records
- [ ] Editor can delete records
- [ ] Editor can upload Excel
- [ ] Viewer cannot add records
- [ ] Viewer cannot edit records
- [ ] Viewer cannot delete records
- [ ] Viewer cannot upload Excel
- [ ] All operations show user info in navbar

### UI/UX Tests
- [ ] User info displays in navbar
- [ ] User role badge shows correctly
- [ ] Admin link only visible to admins
- [ ] Logout link works
- [ ] Responsive design on mobile
- [ ] All pages have consistent styling
- [ ] Error messages are clear
- [ ] Success messages appear

### Security Tests
- [ ] Passwords are hashed in database
- [ ] Plain text passwords never logged
- [ ] SQL injection attempts fail
- [ ] Session data secure in PostgreSQL
- [ ] Cookies have secure flags set
- [ ] CSRF protection ready
- [ ] No sensitive data in error messages
- [ ] Rate limiting ready (optional)

## Performance Tests

- [ ] Login response time < 500ms
- [ ] Page load time < 2s
- [ ] Database queries optimized
- [ ] No N+1 query problems
- [ ] Session table not growing indefinitely
- [ ] Memory usage stable
- [ ] CPU usage normal

## Documentation Tests

- [ ] QUICK_START.md is accurate
- [ ] AUTHENTICATION_SETUP.md is complete
- [ ] SYSTEM_ARCHITECTURE.md is clear
- [ ] IMPLEMENTATION_SUMMARY.md is up-to-date
- [ ] Code comments are helpful
- [ ] Error messages are informative

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## Deployment Steps

### 1. Pre-Deployment
```bash
- [ ] npm install
- [ ] npm test (if tests exist)
- [ ] Review all changes
- [ ] Backup database
```

### 2. Database Migration
```bash
- [ ] Backup existing database
- [ ] Run migration scripts if needed
- [ ] Verify tables created
- [ ] Verify data integrity
```

### 3. Environment Setup
```bash
- [ ] Set DATABASE_URL
- [ ] Set SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/SSL
```

### 4. Application Deployment
```bash
- [ ] Deploy code to server
- [ ] Install dependencies: npm install --production
- [ ] Start application: npm start
- [ ] Verify application running
- [ ] Check logs for errors
```

### 5. Post-Deployment
```bash
- [ ] Create initial admin user
- [ ] Test login functionality
- [ ] Test all user roles
- [ ] Verify data integrity
- [ ] Monitor application logs
- [ ] Set up monitoring/alerts
```

## Rollback Plan

If deployment fails:

1. **Stop Application**
   ```bash
   - [ ] Stop Node.js process
   - [ ] Verify stopped
   ```

2. **Restore Previous Version**
   ```bash
   - [ ] Restore code from backup
   - [ ] Restore database from backup
   - [ ] Verify backups restored
   ```

3. **Restart Application**
   ```bash
   - [ ] Start Node.js process
   - [ ] Verify running
   - [ ] Check logs
   ```

4. **Verify Functionality**
   ```bash
   - [ ] Test login
   - [ ] Test data operations
   - [ ] Verify no data loss
   ```

## Post-Deployment Monitoring

### Daily Checks
- [ ] Application is running
- [ ] No error logs
- [ ] Database connection stable
- [ ] Session table size normal
- [ ] Response times acceptable

### Weekly Checks
- [ ] User activity normal
- [ ] No suspicious login attempts
- [ ] Database performance good
- [ ] Backup completed successfully
- [ ] Security logs reviewed

### Monthly Checks
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Analyze user behavior
- [ ] Optimize database queries
- [ ] Review error logs

## Maintenance Tasks

### Regular Maintenance
- [ ] Clean up old sessions (automated)
- [ ] Monitor disk space
- [ ] Review error logs
- [ ] Update security patches
- [ ] Backup database

### Periodic Tasks
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Audit user accounts
- [ ] Test disaster recovery
- [ ] Review performance metrics

## Troubleshooting Guide

### Common Issues

**Issue: "Cannot find module 'bcryptjs'"**
- [ ] Run `npm install`
- [ ] Verify node_modules exists
- [ ] Check package.json

**Issue: "Connection refused" on login**
- [ ] Verify PostgreSQL running
- [ ] Check DATABASE_URL
- [ ] Verify database exists
- [ ] Check firewall rules

**Issue: Admin dashboard not accessible**
- [ ] Verify logged in as Admin
- [ ] Check user role in database
- [ ] Clear browser cache
- [ ] Check browser console for errors

**Issue: Sessions not persisting**
- [ ] Verify PostgreSQL session table exists
- [ ] Check session table for data
- [ ] Verify SESSION_SECRET set
- [ ] Check cookie settings

**Issue: Slow login**
- [ ] Check database performance
- [ ] Verify bcryptjs salt rounds (should be 10)
- [ ] Monitor server resources
- [ ] Check network latency

## Sign-Off

- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Team approval obtained
- [ ] Deployment authorized

**Deployed by:** ________________
**Date:** ________________
**Version:** ________________
**Notes:** ________________

## Rollback Authorization

If rollback needed:

**Authorized by:** ________________
**Date:** ________________
**Reason:** ________________
**Rollback completed:** ________________
