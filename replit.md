# Real Estate Property Management Platform

## Overview

This is a comprehensive real estate property management SaaS platform built with a modern TypeScript stack. The application serves multiple user roles (master, admin, sellers, owners, management, concierge, and service providers) for managing properties, scheduling appointments, creating client presentation cards, coordinating services, and processing offers.

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