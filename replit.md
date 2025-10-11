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
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and post-appointment client features. Sellers and admins can independently manage appointments with their registered leads through a dedicated appointment management interface accessible via sidebar navigation (/seller/appointments). Supports manual property entry for properties not yet in the database - sellers and admins can specify condominium name and unit number directly when scheduling appointments, allowing work to begin while property data is being loaded. The system automatically detects and preserves manual property information during editing and displays it with clear visual indicators across all views.
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
*   **CRM Lead Management System**: Modern Kanban-style lead management with 10-stage rental pipeline and multi-step lead creation form:
    - **Lead Status Flow**: nuevo → contactado → calificado → cita_agendada → visita_completada → oferta_enviada → en_negociacion → contrato_firmado → ganado → perdido
    - **Sales Funnel Visualization**: Interactive horizontal bar chart showing lead distribution across all stages with key conversion metrics (calificado→cita, cita→visita, visita→oferta, contrato→ganado)
    - **Quick Actions**: Direct access buttons on lead cards for scheduling appointments, creating offers, and viewing details
    - **Enhanced Lead Cards**: Display associated appointments, offers, and contract information with visual indicators
    - **Staff-Created Leads**: Auto-verified email for leads manually registered by sellers/admins to prevent FK constraint violations
    - **Multi-Step Lead Form**: 3-step wizard with visual progress indicator for improved UX:
      - Step 1 (Información Básica): Name, surname, email, phone with duplicate validation, budget
      - Step 2 (Preferencias): Zone of interest, unit type, bedrooms, property interests - all with button-based multi-select
      - Step 3 (Detalles): Source, contract duration, move-in date, notes - button-based multi-select
      - ButtonMultiSelect component provides visual button selection with "Carga Manual" option for custom values
      - Real-time duplicate phone validation with seller contact option
      - Auto-formatting: capitalize names/surnames, lowercase emails
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