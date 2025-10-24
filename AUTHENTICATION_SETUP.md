# Authentication & Role-Based Access Control Setup Guide

## Overview
This document explains the authentication system and role-based access control (RBAC) implemented in the City Data Manager application.

## Installation

### 1. Install Dependencies
```bash
npm install
```

This will install the following new packages:
- `bcryptjs` - For password hashing
- `express-session` - For session management
- `connect-pg-simple` - For PostgreSQL session storage

### 2. Database Setup
The application automatically creates the required tables on startup:
- `users` - Stores user credentials and roles
- `session` - Stores session data
- `entries` - Existing data table

## User Roles

### 1. Admin
- **Privileges:**
  - Create new users
  - Assign/change user roles
  - Delete users
  - Full access to all data operations
  - Access to Admin Dashboard
- **Restrictions:**
  - Only 1 admin can exist in the system
  - Cannot delete their own account

### 2. Editor
- **Privileges:**
  - Add new records
  - Edit existing records
  - Delete records
  - Upload Excel files
  - View all records
- **Restrictions:**
  - Cannot manage users
  - Cannot access admin dashboard

### 3. Viewer
- **Privileges:**
  - View all records
  - Filter records
  - View dashboard
  - Download/export data
- **Restrictions:**
  - Cannot add, edit, or delete records
  - Cannot upload files
  - Cannot manage users

## Getting Started

### First Time Setup

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Access the login page:**
   - Navigate to `http://localhost:3000/login`

3. **Create the first admin user:**
   - Since no users exist initially, you need to create the admin user directly in the database
   - Connect to your PostgreSQL database and run:
   ```sql
   INSERT INTO users (username, password, role) 
   VALUES ('admin', '$2a$10$...', 'Admin');
   ```
   - Or use a tool to hash the password with bcryptjs and insert it

4. **Login with admin credentials:**
   - Username: admin
   - Password: (the password you set)

5. **Create additional users:**
   - Go to Admin Dashboard (`/admin-dashboard`)
   - Use the "Create New User" form
   - Select the role (Admin, Editor, or Viewer)

### Creating Users via Admin Dashboard

1. Login as Admin
2. Click "👥 Admin" in the navigation bar
3. Fill in the user creation form:
   - Username
   - Password
   - Role (Admin, Editor, or Viewer)
4. Click "Create User"

### Changing User Roles

1. Login as Admin
2. Go to Admin Dashboard
3. Find the user in the "Manage Users" table
4. Click "Change Role" button
5. Select new role and confirm

### Deleting Users

1. Login as Admin
2. Go to Admin Dashboard
3. Find the user in the "Manage Users" table
4. Click "Delete" button
5. Confirm deletion

## Protected Routes

### Authentication Required
All routes except `/login` require authentication. Unauthenticated users are redirected to the login page.

### Role-Based Access

| Route | Method | Admin | Editor | Viewer |
|-------|--------|-------|--------|--------|
| `/` | GET | ✓ | ✓ | ✓ |
| `/all` | GET | ✓ | ✓ | ✓ |
| `/filter` | GET | ✓ | ✓ | ✓ |
| `/dashboard` | GET | ✓ | ✓ | ✓ |
| `/add` | POST | ✓ | ✓ | ✗ |
| `/edit/:id` | POST | ✓ | ✓ | ✗ |
| `/delete/:id` | POST | ✓ | ✓ | ✗ |
| `/upload` | POST | ✓ | ✓ | ✗ |
| `/admin-dashboard` | GET | ✓ | ✗ | ✗ |
| `/api/users` | GET | ✓ | ✗ | ✗ |
| `/api/users/create` | POST | ✓ | ✗ | ✗ |
| `/api/users/:id/role` | POST | ✓ | ✗ | ✗ |
| `/api/users/:id` | DELETE | ✓ | ✗ | ✗ |

## Security Features

1. **Password Hashing:** All passwords are hashed using bcryptjs with salt rounds of 10
2. **Session Management:** Sessions are stored in PostgreSQL and expire after 24 hours
3. **Role-Based Access Control:** Backend validation ensures users can only perform actions their role allows
4. **Admin Uniqueness:** The system prevents creating multiple admin accounts
5. **Self-Protection:** Admins cannot delete their own accounts

## Environment Variables

For production, set the following environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key-change-this
PORT=3000
```

## Troubleshooting

### Users table not created
- Ensure PostgreSQL is running and the connection string is correct
- Check the server logs for any database errors

### Cannot login
- Verify the username and password are correct
- Check that the user exists in the database
- Ensure the password was hashed correctly

### Admin dashboard not accessible
- Verify you're logged in as an admin user
- Check the user's role in the database

### Session expires too quickly
- Adjust the `maxAge` value in the session configuration (currently 24 hours)
- Ensure PostgreSQL session table is not being cleared

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=password"
```

### Get Current User Info
```bash
curl http://localhost:3000/api/user-info \
  -H "Cookie: connect.sid=your_session_id"
```

### Create User (Admin only)
```bash
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id" \
  -d '{"username":"editor1","password":"pass123","role":"Editor"}'
```

### Get All Users (Admin only)
```bash
curl http://localhost:3000/api/users \
  -H "Cookie: connect.sid=your_session_id"
```

## Support

For issues or questions about the authentication system, please check:
1. Server logs for error messages
2. Browser console for client-side errors
3. Database connection and user table structure
