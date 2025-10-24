# System Architecture - Authentication & RBAC

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Login Page  │  │  Home Page   │  │ Admin Panel  │       │
│  │  (login.html)│  │(index.html)  │  │(admin-dash)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                    HTTP Requests                             │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                  SERVER LAYER (Express.js)                   │
├───────────────────────────┼──────────────────────────────────┤
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            Authentication Middleware               │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  isAuthenticated()  - Check session valid   │   │    │
│  │  │  hasRole(roles)     - Check user role       │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐    │
│  │                        ▼                            │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │         Route Handlers                       │  │    │
│  │  ├──────────────────────────────────────────────┤  │    │
│  │  │ POST /login          - Authenticate user    │  │    │
│  │  │ GET /logout          - Destroy session      │  │    │
│  │  │ GET /api/user-info   - Get current user     │  │    │
│  │  │ POST /add            - Add record (E/A)     │  │    │
│  │  │ POST /edit/:id       - Edit record (E/A)    │  │    │
│  │  │ POST /delete/:id     - Delete record (E/A)  │  │    │
│  │  │ GET /admin-dashboard - Admin panel (A)      │  │    │
│  │  │ POST /api/users/create - Create user (A)    │  │    │
│  │  │ POST /api/users/:id/role - Change role (A)  │  │    │
│  │  │ DELETE /api/users/:id - Delete user (A)     │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    Database Queries
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                  DATABASE LAYER (PostgreSQL)                 │
├───────────────────────────┼──────────────────────────────────┤
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Tables                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ users                                          │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │ id (PK)                                        │  │   │
│  │  │ username (UNIQUE)                             │  │   │
│  │  │ password (hashed with bcryptjs)               │  │   │
│  │  │ role (Admin | Editor | Viewer)                │  │   │
│  │  │ created_at                                     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ session                                        │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │ sid (Session ID)                              │  │   │
│  │  │ sess (Session data - JSON)                    │  │   │
│  │  │ expire (Expiration timestamp)                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ entries (existing data table)                  │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │ id, customerName, address, city, ...          │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Authentication Flow

User → Login Page → Validate Credentials → Create Session → Redirect to Home

## Authorization Flow

Request → Check Session → Check Role → Allow/Deny → Response

## Role-Based Access Matrix

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View Records | ✓ | ✓ | ✓ |
| Add Records | ✓ | ✓ | ✗ |
| Edit Records | ✓ | ✓ | ✗ |
| Delete Records | ✓ | ✓ | ✗ |
| Upload Excel | ✓ | ✓ | ✗ |
| View Dashboard | ✓ | ✓ | ✓ |
| Export Data | ✓ | ✓ | ✓ |
| Create Users | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ |
| Access Admin Panel | ✓ | ✗ | ✗ |

## Session Management

- Session Creation: Generate ID, store in PostgreSQL, set cookie (24 hours)
- Session Validation: Read cookie, query PostgreSQL, check expiration
- Session Destruction: Delete from PostgreSQL, clear cookie
- Session Expiration: Automatic cleanup of expired sessions

## Password Security

- User Password → bcryptjs.hash(password, 10) → Hashed Password
- Stored: $2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8
- Login: bcryptjs.compare(inputPassword, hashedPassword) → true/false

## Security Layers

1. **Transport Security** - HTTPS, Secure cookies
2. **Authentication** - Username/password validation, Password hashing
3. **Authorization** - Role-based access control, Middleware validation
4. **Data Protection** - Parameterized queries, Input validation
5. **Session Security** - PostgreSQL storage, 24-hour expiration

## Deployment Considerations

- Environment Variables: DATABASE_URL, SESSION_SECRET, PORT
- HTTPS Setup: SSL/TLS certificate, Secure cookies
- Database Security: Strong password, Restrict access, Regular backups
- Session Security: Strong SESSION_SECRET, Monitor session table
- Monitoring: Log authentication, Monitor failed logins, Track activities

For complete architecture details, see the full documentation.
