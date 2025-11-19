# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform designed for intelligent real estate property management in Tulum, Quintana Roo. It streamlines property management tasks, appointment scheduling, client presentations, service coordination, and offer processing. The platform includes role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. The primary goal is to lead the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, emphasizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
Developed with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for state management. UI components utilize Radix UI and Shadcn/ui, styled with Tailwind CSS, supporting light/dark themes. Forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation, adopting a mobile-first design.

### Backend
Implemented with Node.js, Express.js, and TypeScript, providing a RESTful API. Features include role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, user approval workflows, and centralized OpenAI service integration. Contract routes enforce Zod validation, data sanitization, and role-based authorization.

### Data Storage
Utilizes PostgreSQL (Neon serverless) with Drizzle ORM for type-safe interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, rental contracts, and external property management.

### System Design Choices
The platform employs unified middleware for consistent authentication and logging. The public dashboard adapts content based on authentication status. Real-time chat is facilitated via WebSockets with session-based authentication and per-conversation authorization.

Key features include:
*   **Role-Based Access Control**: Granular permissions for various user types.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment.
*   **Property Management Lifecycle**: Property approval, two-stage publication, owner change requests, subleasing, comprehensive photo editing, and a 7-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to create and negotiate rental offers with a bidirectional counter-offer system.
*   **Contract Elaboration System**: Automated workflow for legal document generation and digital signatures after offer acceptance.
*   **HOA Module**: Complete condominium management for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline.
*   **Referral System**: Sellers earn commission for referred property owners.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and 30-minute auto-logout.
*   **Public Rental Form**: Comprehensive 8-step bilingual wizard for tenant applications.
*   **Property Invitation Token System**: Secure, time-limited, single-use tokens for property owners to submit properties without account creation.
*   **Sidebar Menu Visibility Control**: Admin-configurable menu item visibility for specific roles and users.
*   **Internationalization (i18n) System**: Comprehensive bilingual support (Spanish/English) with modular translation files.
*   **Social Media Integration**: Open Graph meta tags for enhanced link previews on social platforms.
*   **Image Compression**: Client-side image compression with real-time progress for improved upload experience.
*   **Property Wizard Optimization**: Intelligent payload management to speed up wizard step saves after image uploads.
*   **Separate Rental and Sale Pricing**: Independent price and currency fields for rental and sale transactions with deep JSONB merge for data integrity.
*   **Editable Owner Terms**: Admin-editable property owner terms and conditions with wizard UI enhancements.
*   **External Property Management System**: Multi-tenant module for managing external agency properties independently, with payment calendar, maintenance tickets, and optional property linking to main system. Includes granular role-based permissions, agency logo upload, user reassignment, backend validation, and a condominium-unit management system (hierarchical property structure for multi-unit condominiums and standalone units).
    *   **Multi-Tenant Security**: All external agency routes enforce ownership verification via `verifyExternalAgencyOwnership()` helper, preventing cross-agency data access. Users are mapped to agencies via `assignedToUser` field, with admin/master roles retaining system-wide access.
    *   **Ownership Verification Pattern**: Each endpoint loads target entity (or parent), then validates that authenticated user's agency matches entity's `agencyId` before returning data. Creation endpoints derive `agencyId` from validated input or parent lookups.
    *   **External Unit Detail View**: Comprehensive unit management page displaying unit information, owner CRUD operations, access control CRUD (door codes, WiFi, gates, etc. with password visibility toggles), and MVP rental contract creation.
    *   **External Rental Contracts (MVP)**: Ability to create active rental contracts for units with tenant information (name, email, phone), contract details (monthly rent, currency, lease duration, start/end dates), smart date calculations, and visual active contract indicators. Prevents duplicate active rentals. Future enhancements planned: contract editing/termination, contract history viewing, payment schedule automation.
    *   **Password Management for External Users**: Admin password reset functionality with temporary password generation, copy-to-clipboard for credentials, and forced password change flow with direct DB updates using Drizzle ORM.
    *   **Streamlined External Agency Sidebar**: External agency users (`external_agency_admin`, `external_agency_accounting`, `external_agency_maintenance`, `external_agency_staff`) see only relevant management options directly in sidebar without collapsibles: Dashboard, Agency Info, Condominiums, Accounting, Maintenance.
    *   **Maintenance Worker Specialty System**: Enhanced user accounts with `maintenanceSpecialty` field supporting 10 specialty types (encargado_mantenimiento, mantenimiento_general, electrico, plomero, refrigeracion, carpintero, pintor, jardinero, albanil, limpieza). Specialty is stored on the user record (users.maintenanceSpecialty), not on assignments, allowing workers to retain their specialty across multiple assignments. Specialty selection integrated into ExternalAccounts page for maintenance role users.
    *   **Maintenance Worker Assignment System**: Complete workflow for assigning specialized maintenance workers to specific condominiums or units. Worker assignments reference the user (userId) and location (condominiumId or unitId) without duplicating specialty data. Features dedicated ExternalMaintenanceWorkers page with tabbed interface displaying worker specialty from user records, assignment CRUD operations, and multi-tenant security enforcement. Backend routes with ownership verification prevent cross-agency worker assignments.
    *   **Owner Management System**: Comprehensive CRUD operations for unit owners via ExternalOwners page. Features include owner listing with unit association, charge creation (amount, currency, description), notification sending (individual and bulk), and complete multi-tenant security with ownership verification on all charge/notification operations.
    *   **Server Error Handling Fix**: Corrected 102 incorrect error handler invocations across routes.ts where parameter order was reversed (error, res instead of res, error), eliminating "res.status is not a function" crashes and ensuring stable server operation.
    *   **ExternalOwners Data Safety Fix**: Implemented nullish coalescing in owner search filter to prevent "Cannot read properties of undefined" runtime errors. Filter now safely handles missing owner.name, owner.email, or owner.phone fields by normalizing to empty strings before comparison operations.
    *   **External Agency Sidebar Translation Optimization**: Shortened sidebar menu labels to prevent text truncation. Updated Spanish translations ("Dashboard Externo" → "Dashboard", "Condominios y Unidades" → "Condominios") and English translations ("External Dashboard" → "Dashboard", "Condominiums & Units" → "Condominiums"). Added missing translations for "Propietarios"/"Owners" and "Trabajadores"/"Workers" menu items.
    *   **External Calendar System**: Comprehensive calendar view for external agencies displaying payments and maintenance tickets. Features include: interactive calendar with event highlighting, clickable events showing detailed information panels, worker assignment display with names and specialties from user records, unit/condominium location details, statistics dashboard (pending payments, scheduled tickets, monthly events), bilingual date formatting, and real-time data integration. Calendar queries external agency users to resolve worker information dynamically.
    *   **Google Calendar Sync Infrastructure**: Backend service ready for automatic synchronization of maintenance tickets to workers' Google Calendars. Features include: event creation/update/deletion functions, Tulum timezone configuration (America/Cancun), comprehensive event descriptions with access information and notes, email notifications to assigned workers, duplicate prevention via extended properties. Field `googleCalendarEmail` added to users table for storing worker calendar addresses. Route integration paused pending user testing and approval.

## External Dependencies
*   Google Calendar API
*   Gmail API
*   Google OAuth 2.0
*   Neon Database (PostgreSQL)
*   Replit Auth (OpenID Connect)
*   Radix UI
*   Lucide React
*   date-fns
*   react-day-picker
*   Zod
*   WebSocket (ws)
*   cookie
*   OpenAI GPT-5