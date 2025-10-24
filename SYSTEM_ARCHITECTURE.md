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

```
┌─────────────────────────────────────────────────────────────┐
│                    User Login Flow                          │
└─────────────────────────────────────────────────────────────┘

1. User visits /login
   │
   ├─→ Check if already authenticated
   │   ├─→ Yes: Redirect to /
   │   └─→ No: Show login page
   │
2. User enters credentials
   │
   ├─→ Submit POST /login
   │
3. Server validates credentials
   │
   ├─→ Query users table for username
   │   ├─→ Not found: Return 401 error
   │   └─→ Found: Continue
   │
   ├─→ Compare password with bcryptjs
   │   ├─→ Invalid: Return 401 error
   │   └─→ Valid: Continue
   │
4. Create session
   │
   ├─→ Store in PostgreSQL session table:
   │   ├─ userId
   │   ├─ username
   │   └─ role
   │
5. Set session cookie
   │
   ├─→ Send Set-Cookie header to client
   │
6. Redirect to home
   │
   └─→ Redirect to /
```

## Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Protected Route Authorization                  │
└─────────────────────────────────────────────────────────────┘

User Request → Protected Route
   │
   ├─→ isAuthenticated Middleware
   │   ├─→ Check req.session.userId exists
   │   │   ├─→ No: Redirect to /login
   │   │   └─→ Yes: Continue
   │
   ├─→ hasRole Middleware (if required)
   │   ├─→ Check req.session.role in allowed roles
   │   │   ├─→ No: Return 403 Forbidden
   │   │   └─→ Yes: Continue
   │
   ├─→ Route Handler
   │   ├─→ Process request
   │   └─→ Return response
   │
   └─→ Response sent to client
```

## Role-Based Access Matrix

```
┌──────────────────────────────────────────────────────────────┐
│                    Permission Matrix                         │
├──────────────────────────────────────────────────────────────┤
│ Action              │ Admin │ Editor │ Viewer │              │
├─────────────────────┼───────┼────────┼────────┤              │
│ View Records        │  ✓    │   ✓    │   ✓    │              │
│ Add Records         │  ✓    │   ✓    │   ✗    │              │
│ Edit Records        │  ✓    │   ✓    │   ✗    │              │
│ Delete Records      │  ✓    │   ✓    │   ✗    │              │
│ Upload Excel        │  ✓    │   ✓    │   ✗    │              │
│ View Dashboard      │  ✓    │   ✓    │   ✓    │              │
│ Export Data         │  ✓    │   ✓    │   ✓    │              │
│ Create Users        │  ✓    │   ✗    │   ✗    │              │
│ Manage Roles        │  ✓    │   ✗    │   ✗    │              │
│ Delete Users        │  ✓    │   ✗    │   ✗    │              │
│ Access Admin Panel  │  ✓    │   ✗    │   ✗    │              │
└─────────────────────┴───────┴────────┴────────┘              │
```

## Session Management

```
┌─────────────────────────────────────────────────────────────┐
│              Session Lifecycle                              │
└─────────────────────────────────────────────────────────────┘

1. Session Creation (on login)
   │
   ├─→ Generate session ID
   ├─→ Store session data in PostgreSQL
   ├─→ Set cookie with session ID
   └─→ Cookie expires in 24 hours

2. Session Validation (on each request)
   │
   ├─→ Read session cookie from request
   ├─→ Query PostgreSQL for session data
   ├─→ Check if session expired
   │   ├─→ Expired: Delete session, redirect to login
   │   └─→ Valid: Continue with request
   └─→ Attach session data to req.session

3. Session Destruction (on logout)
   │
   ├─→ Delete session from PostgreSQL
   ├─→ Clear session cookie
   └─→ Redirect to login

4. Session Expiration (automatic)
   │
   ├─→ PostgreSQL removes expired sessions
   ├─→ User must login again
   └─→ New session created
```

## Password Security

```
┌─────────────────────────────────────────────────────────────┐
│              Password Hashing Process                       │
└─────────────────────────────────────────────────────────────┘

User Password: "myPassword123"
   │
   ├─→ bcryptjs.hash(password, 10)
   │   ├─ Generate random salt (10 rounds)
   │   ├─ Hash password with salt
   │   └─ Return hashed password
   │
   ├─→ Store in database: 
   │   "$2a$10$YIjlrBxvgQvD.KqKa7.Yuu8h8H8H8H8H8H8H8H8H8H8H8H8H8"
   │
   ├─→ On login, compare:
   │   ├─ bcryptjs.compare(inputPassword, hashedPassword)
   │   ├─ Returns true/false
   │   └─ Never stores plain text
   │
   └─→ Result: Secure password storage
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Complete Data Flow                        │
└──────────────────────────────────────────────────────────────┘

User Action                    Server Processing              Database
─────────────────────────────────────────────────────────────────────

1. Visit /login
   │                          Render login.html
   │                                 │
   │◄────────────────────────────────┘

2. Submit credentials
   │
   ├─→ POST /login ────────→ Validate credentials
   │                        Hash & compare password
   │                        Create session ────────→ INSERT session
   │                        Set cookie
   │                                 │
   │◄────────────────────────────────┘

3. Redirect to /
   │
   ├─→ GET / ──────────────→ Check session
   │                        Verify role ◄────────── SELECT session
   │                        Render page
   │                                 │
   │◄────────────────────────────────┘

4. Click "Add Record"
   │
   ├─→ POST /add ──────────→ Check authentication
   │                        Check role (Editor/Admin)
   │                        Validate data
   │                        Insert record ────────→ INSERT entry
   │                        Redirect
   │                                 │
   │◄────────────────────────────────┘

5. Admin creates user
   │
   ├─→ POST /api/users/create ─→ Check authentication
   │                            Check role (Admin only)
   │                            Hash password
   │                            Insert user ────────→ INSERT users
   │                            Return success
   │                                 │
   │◄────────────────────────────────┘

6. Logout
   │
   ├─→ GET /logout ────────→ Destroy session ────→ DELETE session
   │                        Clear cookie
   │                        Redirect to login
   │                                 │
   │◄────────────────────────────────┘
```

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                   Security Architecture                      │
└──────────────────────────────────────────────────────────────┘

Layer 1: Transport Security
├─ HTTPS (recommended for production)
└─ Secure cookies

Layer 2: Authentication
├─ Username/password validation
├─ Password hashing (bcryptjs)
└─ Session management

Layer 3: Authorization
├─ Role-based access control
├─ Middleware validation
└─ Backend permission checks

Layer 4: Data Protection
├─ Parameterized queries (SQL injection prevention)
├─ Input validation
└─ Error handling (no sensitive info in errors)

Layer 5: Session Security
├─ PostgreSQL session storage
├─ 24-hour expiration
├─ Secure cookie handling
└─ Session destruction on logout
```

## Deployment Considerations

```
┌──────────────────────────────────────────────────────────────┐
│              Production Deployment                           │
└──────────────────────────────────────────────────────────────┘

1. Environment Variables
   ├─ DATABASE_URL (PostgreSQL connection)
   ├─ SESSION_SECRET (change from default)
   └─ PORT (if needed)

2. HTTPS Setup
   ├─ Use SSL/TLS certificate
   ├─ Enable secure cookies
   └─ Set cookie.secure = true

3. Database Security
   ├─ Use strong database password
   ├─ Restrict database access
   ├─ Regular backups
   └─ Monitor for suspicious activity

4. Session Security
   ├─ Use strong SESSION_SECRET
   ├─ Adjust session expiration as needed
   └─ Monitor session table size

5. Monitoring
   ├─ Log authentication attempts
   ├─ Monitor failed logins
   ├─ Track user activities
   └─ Alert on suspicious behavior
```

## Performance Optimization

```
┌──────────────────────────────────────────────────────────────┐
│              Performance Considerations                      │
└──────────────────────────────────────────────────────────────┘

1. Database Queries
   ├─ Use indexes on username column
   ├─ Optimize session queries
   └─ Regular query analysis

2. Password Hashing
   ├─ 10 salt rounds (balance: security vs speed)
   ├─ ~100ms per hash (acceptable)
   └─ Async operations to prevent blocking

3. Session Management
   ├─ PostgreSQL storage (scalable)
   ├─ 24-hour expiration (cleanup)
   └─ Connection pooling

4. Caching
   ├─ Cache user roles in session
   ├─ Avoid repeated database queries
   └─ Invalidate on role changes
```

This architecture provides a secure, scalable, and maintainable authentication and authorization system for the City Data Manager application.
