# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive real estate property management SaaS platform built with a modern TypeScript stack. The application serves multiple user roles (master, admin, sellers, owners, management, concierge, and service providers) for managing properties, scheduling appointments, creating client presentation cards, coordinating services, and processing offers.

The platform features role-based access control, Google Calendar integration for appointment scheduling, a service provider marketplace, and a complete backoffice for offer management. The UI follows a professional, data-dense dashboard pattern inspired by modern SaaS applications, with support for both light and dark modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- Shadcn/ui component library with custom "new-york" style variant
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Support for light/dark themes with CSS custom properties

**Design System:**
- Professional color palette optimized for real estate and property management
- Custom HSL-based color tokens for consistency across themes
- Inter font family for primary text (data-dense interfaces)
- JetBrains Mono for monospace content (IDs, transaction numbers)
- Elevation system using layered shadows for depth hierarchy

**State Management:**
- React Query for async state and API caching
- Local React state for UI-only concerns
- Custom hooks pattern for reusable business logic
- Authentication state managed via dedicated useAuth hook

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js for RESTful API
- TypeScript with ESM modules throughout
- Session-based authentication using Replit Auth (OpenID Connect)
- PostgreSQL session store for persistent sessions

**API Design:**
- RESTful endpoints following resource-based patterns
- Role-based middleware for authorization (master, admin, admin_jr, seller, owner, management, concierge, provider)
- Consistent error handling with HTTP status codes
- JSON request/response format

**Authentication & Authorization:**
- **Dual Authentication System**:
  - **Replit Auth** (OpenID Connect/Passport.js): For regular users (sellers, owners, management, concierge, service providers)
  - **Local Admin Auth** (username/password + bcrypt): Exclusive authentication method for administrators
- Session management with connect-pg-simple for both authentication types
- Role-based access control enforced at route level
- User approval workflow (pending → approved/rejected states)
- Unified middlewares support both authentication methods:
  - `isAuthenticated`: Checks admin session first, then Replit Auth
  - `requireRole`: Verifies admin role from session first, then Replit Auth user role
- Admin role switching feature for testing different role perspectives
  - Master and Admin users can temporarily view the platform as any other role
  - Visual indicator (badge) shows when viewing as another role
  - Automatic cleanup of temporary role on non-admin login for security
  - Backend maintains real session role for all operations

### Data Storage

**Database:**
- PostgreSQL via Neon serverless platform
- Drizzle ORM for type-safe database queries and migrations
- WebSocket connection support for serverless environments

**Schema Design:**
- User management with role-based permissions (userRoleEnum, userStatusEnum)
- Admin users table (`admin_users`) with bcrypt-hashed passwords for local authentication
- Properties with flexible status (rent, sale, both, rented, sold, inactive)
- Appointments with type discrimination (in-person vs video)
- Presentation cards for client property matching
- Service providers with associated services
- Offers workflow (pending, accepted, rejected, under-review)
- Property staff assignments for access control
- Audit logs for tracking user actions (create, update, delete, view, approve, reject, assign)
- Session storage for both Replit Auth and admin authentication

**Data Relationships:**
- One-to-many: Users to properties, properties to appointments
- Many-to-many: Properties to staff members (via propertyStaff junction table)
- Hierarchical permissions system for fine-grained access control

### External Dependencies

**Third-Party Services:**
- **Google Calendar API**: Automated Google Meet event creation for video appointments
  - OAuth2 authentication with refresh tokens
  - Automatic meeting link generation
  - Calendar event lifecycle management (create/delete)
  - Graceful degradation when not configured

**Database Provider:**
- **Neon Database**: Serverless PostgreSQL with WebSocket support
  - Connection pooling via @neondatabase/serverless
  - Automatic SSL/TLS encryption
  - Environment-based configuration (DATABASE_URL)

**Authentication:**
- **Replit Auth**: OpenID Connect provider for user authentication
  - Session-based auth with PostgreSQL persistence
  - 7-day session TTL with HTTP-only secure cookies
  - OIDC discovery and token management

**Development Tools:**
- **Replit Platform Plugins**: Development experience enhancements
  - Runtime error modal overlay
  - Code cartographer for visualization
  - Development banner

**UI Libraries:**
- **Radix UI**: Comprehensive primitive component library (20+ components)
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting
- **react-day-picker**: Calendar component for date selection

**Type Safety & Validation:**
- **Zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas
- Shared schema definitions between frontend and backend

## Recent Features

### Calendar View for Appointments (October 2025)
- Monthly calendar visualization with react-day-picker
- Day highlighting for dates with scheduled appointments
- Selected day view showing all appointments for that date
- List of upcoming appointments (next 5)
- Direct integration with AppointmentFormDialog for editing/rescheduling
- Ability to cancel appointments from calendar view
- Accessible via sidebar navigation

### Audit Logging System (October 2025)
- Comprehensive audit log infrastructure for compliance and security tracking
- Database table (`audit_logs`) with fields: userId, action, entityType, entityId, details, ipAddress, userAgent
- API endpoints for creating and querying audit logs:
  - GET `/api/audit-logs` - Query logs with filters (admin/master only)
  - GET `/api/audit-logs/user/:userId` - User-specific audit history
  - POST `/api/audit-logs` - Create new audit log entry
- Storage methods: `createAuditLog()`, `getAuditLogs()`, `getUserAuditHistory()`
- Centralized helper function `createAuditLog()` in routes.ts for automatic metadata capture
- Automatic logging implemented for all critical operations:
  - **User Management**: Approve, reject, approve all, update role
  - **Properties**: Create, update, delete
  - **Appointments**: Create, update, cancel/delete
  - **Offers**: Create, update status
  - **Tasks**: Create, update, delete
- Spanish-language details for audit trail readability
- Fail-safe error handling ensures logging never interrupts operations
- Logs captured before deletes to preserve entity information

### User Profile & Activity History (October 2025)
- UserProfileDialog component showing detailed user information and activity history
- Two-tab interface: "Actividad Reciente" and "Detalles"
- Activity timeline with action icons, timestamps, and detailed descriptions
- Personal information display (name, email, role, status, dates)
- Users page enhanced with approved users tab
- Clickable user cards to open profile dialog
- Real-time cache invalidation for seamless user approval workflow
- Admin/master access to view any user's profile and history
- Users can view their own profile and activity log

### Triple Authentication System (October 2025)
The platform supports three independent authentication methods with normalized identity management:

#### 1. Public User Registration & Local Auth (October 2025)
- **User Registration Flow**:
  - Public self-registration via `/register` page
  - Email/password authentication with bcrypt hashing (10 salt rounds)
  - Email verification required via Resend integration
  - Database tables: `users`, `email_verification_tokens`
  - Default role: "cliente" (client) upon registration
  - Status: "pending" until admin approval

- **Email Verification**:
  - Verification tokens expire after 24 hours
  - Email sent via Resend API with verification link
  - Token stored in `email_verification_tokens` table
  - Verification endpoint: GET `/verify-email?token=xxx`
  - Sets `email_verified` flag to true upon successful verification

- **Role Request System**:
  - Users can request additional roles: owner, seller, management, concierge, provider
  - Stored in `role_requests` table with status (pending, approved, rejected)
  - Admin approval required via Clients page > "Solicitudes de Rol" tab
  - Security validations:
    - Prevents duplicate approvals (status must be pending)
    - Validates requested role against allowed list
    - Checks user doesn't already have the requested role
  - Approved roles stored in `additional_role` field

- **Local Login Endpoints**:
  - POST `/api/auth/login` - User login with email/password
  - POST `/api/auth/local/logout` - User logout
  - GET `/api/auth/user` - Get current user (unified for all auth types)

- **Login Security**:
  - Verifies email is verified (`email_verified === true`)
  - Verifies user is approved (`status === "approved"`)
  - Verifies password with bcrypt comparison
  - Creates session with `req.session.userId`

- **Frontend Pages**:
  - `/register` - Registration form with validation
  - `/login` - Login form for local users
  - `/verify-email` - Email verification confirmation page
  - `/` (Landing) - Entry point with login/register buttons

- **Clients Management** (Admin):
  - Two tabs: "Clientes" and "Solicitudes de Rol"
  - View all registered users (approved and pending)
  - Approve/reject user registrations
  - Approve/reject role requests
  - Real-time cache invalidation for seamless workflow

#### 2. Admin Local Auth
- **Admin Authentication**:
  - Database table `admin_users` with username, bcrypt-hashed passwords, and role
  - POST `/api/auth/admin/login` endpoint with Zod validation
  - POST `/api/auth/admin/logout` endpoint for session cleanup
  - GET `/api/auth/admin/user` endpoint for session verification
  - Admin login page at `/admin-login` route
  - `useAdminAuth` hook for frontend admin session management

- **Admin Management**:
  - CLI script `server/createAdmin.ts` for creating admins
  - Default test credentials: username="admin", password="admin123"
  - Storage methods: `getAdminByUsername()`, `createAdmin()`, `getAllAdmins()`

#### 3. Replit Auth (OAuth)
- **Replit Authentication**:
  - OpenID Connect provider for OAuth-based user authentication
  - Session-based auth with PostgreSQL persistence
  - 7-day session TTL with HTTP-only secure cookies
  - OIDC discovery and token management
  - Automatic token refresh for expired sessions

#### Unified Middleware & Identity Normalization
- **`isAuthenticated` Middleware**:
  - Checks admin session first (`req.session.adminUser`)
  - Then checks local user session (`req.session.userId`)
  - Finally checks Replit Auth (`req.user` with OAuth tokens)
  - **Normalizes all authentication types** into consistent `req.user` structure:
    ```typescript
    req.user = {
      claims: { sub, email, first_name, last_name },
      [authType]: true  // adminAuth, localAuth, or OAuth tokens
    }
    ```

- **`requireRole` Middleware**:
  - Verifies roles from normalized `req.user.claims.sub`
  - Loads user from database for role verification
  - Supports `additionalRole` for users with multiple roles
  - Seamless handling of admin/local/Replit users

- **Benefits of Normalization**:
  - Audit logs work consistently for all auth types
  - Authorization logic is uniform across all routes
  - Downstream code always receives `req.user.claims.sub`
  - No bifurcated logic paths between auth methods

- **Frontend Integration**:
  - App.tsx handles all three authentication states simultaneously
  - Conditional rendering based on authentication type
  - Unified logout handling with query cache invalidation
  - Consistent user experience across auth methods

- **Security Features**:
  - All passwords hashed with bcrypt (10 salt rounds)
  - Session-based authentication with PostgreSQL persistence
  - Email verification required for local users
  - Admin approval required for local users
  - Query invalidation on login/logout for immediate UI updates
  - Zod schema validation for all auth credentials