# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers features such as property management, appointment scheduling with a concierge system, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. Its ambition is to dominate the Tulum real estate market through enhanced commission systems, marketing automation, predictive analytics, and AI-powered features.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a modern web stack, emphasizing a professional, responsive, and accessible user experience with full internationalization.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. Forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation. The platform is fully optimized for mobile devices with a mobile-first design approach and responsive spacing patterns. Cache invalidation is handled with a `invalidateRelatedQueries` helper function using React Query.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for general users and local username/password for administrators. Session management and user approval workflows are integral. Centralized OpenAI service integration utilizes the GPT-4 model. Contract routes implement strict Zod validation, data sanitization, and role-based authorization for verification workflows.

### Data Storage
PostgreSQL (Neon serverless) with Drizzle ORM provides type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management with a three-state approval workflow, a bidirectional review system, financial tracking, payout management, and a comprehensive rental contract system with automated calculations and digital signature tracking. An automatic error tracking system logs errors and notifies administrators. Performance is optimized with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication status. WebSocket-based real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint facilitates role switching for testing purposes.

### Key Features
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment capability. Admins can update both primary and additional roles for any user via the user management interface (PATCH /api/admin/users/:userId/role).
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and post-appointment client features. Sellers and admins can independently manage appointments with their registered leads through a dedicated appointment management interface accessible via sidebar navigation (/seller/appointments).
*   **Property Management Lifecycle**: Features property approval workflows with two-stage publication system (approved → published), owner change requests, sublease functionality, comprehensive photo editing, and a 5-step property submission wizard with digital agreement signing. Properties must be both "approved" and "published" to appear on the public home page for security reasons.
    - **Property Approval States**: 
      - draft: Borrador, aún no enviada
      - pending_review: Enviada, esperando revisión inicial
      - inspection_scheduled: Inspección programada
      - inspection_completed: Inspección realizada
      - approved: Aprobada para publicación (visible solo a usuarios autenticados)
      - changes_requested: Se solicitaron cambios
      - rejected: Rechazada
    - **Publication System**: Properties have two separate fields: `approvalStatus` (enum) and `published` (boolean). Admin endpoints:
      - POST /api/admin/properties/:id/approve - Aprueba y opcionalmente publica (`publish: true` por defecto)
      - POST /api/admin/properties/:id/publish - Publica una propiedad ya aprobada (establece `published = true`)
      - POST /api/admin/properties/:id/reject - Rechaza y despublica una propiedad
    - **Public Home Filter**: Non-authenticated users only see properties with `published = true` for security (enforced in GET /api/properties/search endpoint)
    - **Featured Properties**: Admin can mark properties as "featured" (destacadas) for special visibility. PATCH /api/admin/properties/:id/featured endpoint toggles featured status. UI includes toggle button with star icon and stats counter in admin dashboard.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system. Administrators can grant rental opportunities directly.
*   **Contract Elaboration System**: Automated workflow triggered after offer acceptance, involving client and owner information forms, admin document verification, lawyer contract elaboration, tripartite chat for negotiations, and digital signatures. Contracts progress through statuses: draft, apartado, firmado, check_in, activo. UI includes tabbed interfaces and visual progress indicators.
*   **HOA (Homeowners Association) Module**: Complete condominium management system for admin, owner, and HOA Manager roles. Includes unit, fee, issue management, and a comprehensive announcement system with assignment workflows, notifications, and security.
*   **Comprehensive Notification System**: Full-featured notification system with real-time updates, filtering, priority levels, email integration, and detailed user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security feature.

## External Dependencies
*   Google Calendar API
*   Neon Database (PostgreSQL)
*   Replit Auth (OpenID Connect)
*   Resend API
*   Radix UI
*   Lucide React
*   date-fns
*   react-day-picker
*   Zod
*   WebSocket (ws)
*   cookie
*   OpenAI GPT-5