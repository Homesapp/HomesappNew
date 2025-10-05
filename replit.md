# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive SaaS platform designed for real estate property management, currently focused on the Tulum, Quintana Roo market. It supports multiple user roles (e.g., master, admin, seller, owner, client) to manage properties, schedule appointments, create client presentations, coordinate services, and process offers. Key capabilities include role-based access control, Google Calendar integration, a service provider marketplace, a property submission workflow with digital agreement signing, and a full back office for offer management. The platform aims to streamline property management operations and enhance user experience in the real estate sector with a professional, data-dense dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 5, 2025:**
- Updated logo to final version ("H mes (500 x 300 px)_1759672952263.png") and resized to h-16 across all components
- Header height adjusted to h-20 to match smaller logo
- Primary brand color changed to #21ad44 (HSL: 141 68% 40%) throughout application
- Carousel navigation arrows repositioned below carousel content, centered with gap-4 spacing for better UX
- **Location Standardization**: All property locations updated to "Tulum" for consistency and improved search functionality
- **Condominium System**: Created approval workflow for condominiums with 396 pre-approved units
  - Owners/users can request new condominiums (status: pending)
  - Admins approve/reject condominium requests via API endpoints
  - Properties can now be linked to approved condominiums with unit details
  - Full Zod validation and error handling on all condominium routes
- **Client Dashboard**: New dedicated dashboard for clients with appointment management
  - "Mis Citas" section with upcoming, calendar, and history views
  - Integrated calendar showing appointment dates with date selection
  - Video call integration with Google Meet links
  - Appointment status tracking (pending, confirmed, completed, cancelled)
  - Direct booking capability from dashboard
- **Profile Picture Upload**: Implemented device-based image upload for user profiles
  - Users can upload profile pictures directly from their device (no URL required)
  - Images converted to base64 and stored in database
  - File validation: JPG/PNG/GIF formats, maximum 2MB size
  - Profile image displays as thumbnail in UserProfileMenu (top-right)
  - Large avatar preview on profile page with upload/remove controls
  - Smart update logic: only sends image data when actually changed to preserve existing photos

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing and TanStack Query for server state management. UI components are built with Radix UI primitives and Shadcn/ui, styled with Tailwind CSS, supporting light/dark themes and internationalization (Spanish/English). It features a professional design system and role-switching capabilities (owner/client).

### Backend

The backend uses Node.js with Express.js and TypeScript (ESM modules), providing a RESTful API with role-based middleware and JSON-based error handling. It employs a dual authentication system: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage

The application uses PostgreSQL (Neon serverless) and Drizzle ORM for type-safe interactions. The schema supports user management, property statuses, appointment scheduling, client presentation cards, service providers, offer workflows, and staff assignments, with audit logs for critical actions. A lead capture system tracks user actions and manages rental opportunity requests.

**Condominium Management**: A dedicated `condominiums` table manages approved condominium listings with a three-state approval workflow (pending/approved/rejected). Properties can reference condominiums and include unit-specific details (unitType, unitNumber, condoName). The system includes 396 pre-approved condominiums from the Tulum market. API endpoints enforce role-based access (admin-only approval/rejection) with full Zod validation.

### Key Features and Workflows

*   **Property Management**: Includes a property approval workflow (draft → pending → approved/rejected), owner-submitted change requests with admin approval, and owner settings for appointment auto-approval. All properties are standardized to Tulum location for consistency.
*   **Property Submission**: A multi-step wizard with automatic draft saving, digital agreement signing using admin-managed templates, and audit logging for all agreement actions. Integration with approved condominium listings for properties within condominiums.
*   **Condominium Workflow**: User-requested condominiums require admin approval before appearing in selection lists. Admins can approve/reject requests with full audit trail. 396 pre-approved Tulum condominiums available in the system.
*   **Client Dashboard**: Dedicated dashboard for clients featuring appointment management with calendar integration, upcoming appointments display, appointment history, and direct booking capabilities. Supports video call integration with Google Meet.
*   **User Experience**: Features an Airbnb-style role switching, full i18n support, a WebSocket-based real-time chat system with secure authentication, enhanced presentation cards with detailed property and client information, and granular email notification preferences.
*   **Public Dashboard**: An Airbnb-inspired design adapting for authenticated vs. non-authenticated users, with dual pricing support (rental/sale) and improved property listing displays.

### System Design Choices

The platform uses a unified middleware for consistent authentication handling (`req.user`), automatic logging for auditing, and a public dashboard that adapts its experience based on user authentication. A calendar view for appointments and detailed user profiles are also included. WebSocket security for the real-time chat implements session-based authentication, per-conversation authorization, and secure connection handling.

## External Dependencies

*   **Google Calendar API**: For event creation and management.
*   **Neon Database**: Serverless PostgreSQL.
*   **Replit Auth**: OpenID Connect provider for user authentication.
*   **Resend API**: For email notifications.
*   **Radix UI**: Primitive component library.
*   **Lucide React**: Icon library.
*   **date-fns**: Date manipulation.
*   **react-day-picker**: Calendar component.
*   **Zod**: Runtime type validation.
*   **WebSocket (ws)**: Server-side WebSocket implementation.
*   **cookie**: Cookie parsing.