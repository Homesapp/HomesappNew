# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for smart real estate property management in Tulum, Quintana Roo, targeting property management, appointment scheduling, client presentations, service coordination, and offer processing. It features role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. The platform aims to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, emphasizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
Developed with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for state management. UI components leverage Radix UI and Shadcn/ui, styled with Tailwind CSS, supporting light/dark themes. Forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation, adopting a mobile-first design.

### Backend
Implemented with Node.js, Express.js, and TypeScript, providing a RESTful API. Features include role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, user approval workflows, and centralized OpenAI service integration (GPT-4). Contract routes enforce Zod validation, data sanitization, and role-based authorization.

### Data Storage
Utilizes PostgreSQL (Neon serverless) with Drizzle ORM for type-safe interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, rental contracts, and external property management (agencies, properties, contracts, payment schedules, payments, maintenance tickets, condominiums, units, unit owners, unit access controls).

### System Design Choices
The platform employs unified middleware for consistent authentication and logging. The public dashboard adapts content based on authentication status. Real-time chat is via WebSockets with session-based authentication and per-conversation authorization.

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
*   **External Property Management System**: Multi-tenant module for managing external agency properties independently, with payment calendar, maintenance tickets, and optional property linking to main system. Admin-only creation: External agencies can only be created by HomesApp administrators. Features include:
    - Granular role-based permissions with four external agency roles:
      - `external_agency_admin`: Full administrative access to agency operations
      - `external_agency_accounting`: Financial operations (dashboard, payments, payment schedules, agency view-only)
      - `external_agency_maintenance`: Property operations (dashboard, properties, contracts, maintenance tickets)
      - `external_agency_staff`: Read-only access to all external agency data (view-only dashboard, properties, payments, tickets)
    - **Agency Logo Upload**: File-based logo upload with client-side image compression (max 800x800px, 85% quality) replacing URL text field
    - **User Reassignment**: Ability to reassign agencies to different users through edit dialog with automatic role updates
    - **Backend Validation**: Server-side validation ensures new assigned users are approved and don't already manage other agencies
    - **Condominium-Unit Management System**: Hierarchical property structure enabling agencies to manage multi-unit condominiums with:
      - **Condominium Management**: Properties that contain multiple units (condominiums) or standalone properties (units optional)
      - **Unit Management**: Individual units within condominiums with unit numbers, floor numbers, and rental status tracking
      - **Unit Owner Tracking**: Complete owner information (name, phone, email) with active owner identification and historical records
      - **Access Control System**: Unit-level access codes for gate, garage, elevator, door with active/inactive status management
      - **Payment Calendar Integration**: Color-coded payment types (rent, electricity, water, internet, HOA fees, special payments) at unit level
      - **Maintenance Calendar Integration**: Unit-level maintenance tickets with color-coded types and user assignment capability
      - **MISTIQ Tulum Implementation**: 7 pre-configured condominiums (MISTIQ TULUM, GARDENS I & II, TEMPLE I & II, VILLAS, PREMIUM) ready for unit population

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

## Recent Development Notes

### Condominium-Unit Management System (November 19, 2025)

#### ✅ Completed Components

**Database Schema (shared/schema.ts)**
- `external_condominiums` table: Stores condominium properties (name, total units, floors, features, notes)
- `external_units` table: Individual units with unit number, floor, rental status, condominium reference
- `external_unit_owners` table: Owner records with contact info, active status, historical tracking
- `external_unit_access_controls` table: Access codes for gate, garage, elevator, door with active/inactive status
- Extended `service_type` enum with "hoa" and "special" payment types for HOA fees and special payments
- Added `unitId` foreign key to `external_rental_contracts` for unit-level contract assignment
- Added `unitId` foreign key to `external_maintenance_tickets` for unit-level maintenance tracking

**Storage Layer (server/storage.ts)**
- Complete CRUD operations for all new tables (condominiums, units, owners, access controls)
- Specialized queries: `getExternalUnitsByCondominium`, `getActiveExternalUnitOwner`, `setActiveExternalUnitOwner`
- Filter support for active/inactive records and condominium-specific queries
- Unit-level maintenance ticket retrieval: `getExternalMaintenanceTicketsByUnit`

**Database Seeding**
- 7 MISTIQ Tulum condominiums created in database:
  - MISTIQ TULUM (85 units, 7 floors)
  - MISTIQ GARDENS I (24 units, 3 floors)
  - MISTIQ GARDENS II (24 units, 3 floors)
  - MISTIQ TEMPLE I (24 units, 3 floors)
  - MISTIQ TEMPLE II (24 units, 3 floors)
  - MISTIQ VILLAS (8 units, 2 floors)
  - MISTIQ PREMIUM (10 units, 3 floors)
- Each condominium assigned to MISTIQ Tulum agency (admin@mistiq.com)
- Test credentials: admin@mistiq.com / MistiqAdmin2025! (requires password change on first login)

#### 🚧 Pending Implementation

**Backend Routes (server/routes.ts)**
- API endpoints for condominium operations (GET, POST, PUT, DELETE)
- API endpoints for unit operations with filtering by condominium
- API endpoints for unit owner management (create, update, set active owner)
- API endpoints for access control management
- Update existing payment/maintenance routes to support unit-level operations

**Frontend Pages & Components**
- Condominium management page (list, create, edit condominiums)
- Unit management page with condominium filter/grouping
- Unit detail view with owner history, access controls, payment calendar, maintenance calendar
- Owner management modal/dialog for adding/updating owners
- Access control management interface
- Payment calendar with color-coded service types (rent=blue, electricity=yellow, water=cyan, internet=purple, hoa=green, special=orange)
- Maintenance calendar with color-coded maintenance types and user assignment
- Sidebar menu updates for external agency users (Dashboard, Propiedades, Contabilidad by unit/condo/global, Mantenimientos)

**Data Integration**
- Connect payment schedules UI to unit-level data
- Connect maintenance tickets UI to unit-level data
- Implement unit selection in contract creation/editing forms
- Color-coding system for calendars based on service/maintenance types

#### Technical Notes
- Address fields intentionally not required for condominiums/units (optional in this context)
- Units can exist as standalone properties (condominiumId can be null)
- Active owner system allows only one active owner per unit at a time
- Access controls support active/inactive status for security rotation
- Payment calendar uses existing `service_type` field with extended enum
- Maintenance calendar uses existing maintenance types with color mapping

#### Next Steps Priority
1. Create backend API routes for all CRUD operations
2. Build condominium/unit management frontend pages
3. Implement unit detail view with integrated calendars
4. Add sidebar menu configuration for external agency roles
5. Test complete workflow: condominium → units → owners → access controls → payments → maintenance