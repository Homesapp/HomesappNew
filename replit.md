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
- Replit Auth integration via OpenID Connect/Passport.js
- Session management with connect-pg-simple
- Role-based access control enforced at route level
- User approval workflow (pending → approved/rejected states)
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
- Properties with flexible status (rent, sale, both, rented, sold, inactive)
- Appointments with type discrimination (in-person vs video)
- Presentation cards for client property matching
- Service providers with associated services
- Offers workflow (pending, accepted, rejected, under-review)
- Property staff assignments for access control
- Audit logs for tracking user actions (create, update, delete, view, approve, reject, assign)
- Session storage for authentication

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