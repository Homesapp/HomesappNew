# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for intelligent real estate property management in Tulum, Quintana Roo. It aims to streamline property management, appointment scheduling, client presentations, service coordination, and offer processing. The platform includes role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. Its ambition is to lead the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
Developed with React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for state management. UI components leverage Radix UI and Shadcn/ui, styled with Tailwind CSS, supporting light/dark themes. Forms utilize Shadcn Form, `useForm`, and `zodResolver` with Zod for validation, adopting a mobile-first design.

### Backend
Implemented with Node.js, Express.js, and TypeScript, providing a RESTful API. Features include role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, user approval workflows, and centralized OpenAI service integration. Contract routes enforce Zod validation, data sanitization, and role-based authorization.

### Data Storage
Utilizes PostgreSQL (Neon serverless) with Drizzle ORM for type-safe interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, rental contracts, and external property management.

### System Design Choices
The platform employs unified middleware for consistent authentication and logging. The public dashboard adapts content based on authentication status. Real-time chat is facilitated via WebSockets with session-based authentication and per-conversation authorization.

Key features include:
*   **Role-Based Access Control**: Granular permissions for various user types.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment.
*   **Property Management Lifecycle**: Comprehensive property submission, approval, publication, and digital agreement signing.
*   **Rental Management**: Active rental portals, service-based payment tracking, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for creating and negotiating rental offers with a bidirectional counter-offer system.
*   **Contract Elaboration System**: Automated legal document generation and digital signatures.
*   **HOA Module**: Complete condominium management for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline.
*   **Referral System**: Commission for referred property owners.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and 30-minute auto-logout.
*   **External Property Management System**: Multi-tenant module for managing external agency properties with independent payment calendars, maintenance tickets, and optional property linking. Includes granular role-based permissions, condominium-unit management, and robust multi-tenant security.
    *   **Maintenance Worker Management**: System for assigning specialized maintenance workers to specific condominiums or units, including specialty tracking and bulk assignment capabilities.
    *   **Owner Management System**: Comprehensive CRUD for unit owners, including charge creation and notification sending, with multi-tenant security.
    *   **External Calendar System**: Displays payments, maintenance tickets, and rental contract start dates for external agencies. Features include:
        - **Compact two-column layout:** Optimized grid with calendar and inline-expandable event list for efficient space utilization
        - **Inline event expansion:** Collapsible event details replace full-screen modal for seamless navigation
        - **Comprehensive condominium display:** Helper function resolves unit and condominium information with localized fallbacks
        - **Condensed filters and statistics:** Single-row horizontal layout with compact checkboxes and metrics
        - **Rental contract events:** Contract start dates appear in calendar with purple icon
        - **Complete contract details:** Shows tenant info, unit, monthly rent (with validation), duration, start/end dates, contact info, and rental purpose
        - **Type-safe event handling:** Discriminated union with ExternalPayment, ExternalMaintenanceTicket, and ExternalRentalContract
        - Event highlighting with color-coded icons (green for payments, blue for tickets, purple for contracts)
        - Worker assignment details and statistics
        - Robust null-checking for optional date and monetary fields
    *   **Rental Purpose Classification**: Rental contracts now specify their purpose with enum values:
        - **Living**: Contract for primary residence
        - **Sublease**: Contract for subleasing/short-term rentals
        - Purpose field appears in creation form, edit dialog, and contract detail page with visual badges
        - Default value: "living" for all new contracts
    *   **Google Calendar Sync Infrastructure**: Backend service for automatic synchronization of maintenance tickets to workers' Google Calendars with detailed event descriptions and email notifications.
    *   **Temporary Credentials Management**: Workflow for secure sharing of temporary user credentials with forced password changes on first login.
    *   **Unit Information Quick-Share System**: One-click copy-to-clipboard for unit information and access controls.
    *   **External Rentals Management**: Comprehensive rental contract dashboard with optimized performance. Features include:
        - Performance-optimized list endpoint using bulk queries (3 total queries for paginated results, avoiding N+1 problem)
        - Pagination support (default limit: 100, max: 500) for handling large datasets
        - **Enhanced service display:** Detailed list showing service type, amount (with validation), and payment day of month with Clock icon
        - **Number.isFinite validation:** Safe parsing of all monetary values with descriptive placeholders ("Monto no especificado") when data is missing or invalid
        - Next payment information with due date, amount, and service type
        - Dual view modes: card and table layouts with responsive design
        - **Mobile-optimized buttons:** flex-wrap layout prevents button text truncation on small screens
        - Advanced filtering by status, condominium, and unit number with searchable combobox components
        - Rental cancellation with automatic cleanup of future pending payments
        - **Redesigned contract detail page:** Professional single-view layout without tabs, consolidating all information (contract details, documents, payments, services) in organized 2-column grid
        - **Rental Purpose Field:** Visual badges (Home icon for living, Building2 for sublease) showing contract purpose with selection in creation/edit forms
        - **Contract Editing**: Full CRUD for active rental contracts including tenant information, monthly rent, rental purpose, end date, and notes with backend validation and multi-tenant security
        - **Payment Schedule Management**: Complete CRUD operations for payment schedules (rent, electricity, water, internet, gas, maintenance) with automatic cache invalidation using TanStack Query v5 array-based query keys
        - **Enhanced Rental Creation Workflow**: Streamlined process with "Nueva Renta" button in rentals list, security deposit field, rental purpose selection, informational section about payment schedules, and automatic numeric coercion for monetary values
    *   **Unit Status Management**: Complete system for managing unit availability and operational status. Features include:
        - PATCH endpoint `/api/external-units/:id/toggle-status` for toggling unit active/suspended state with multi-tenant security
        - Soft state changes preserving all historical records (no physical deletion)
        - Professional condominium statistics dashboard showing total units, active/suspended counts, and rented/available breakdown
        - Enhanced units table with dedicated status columns: Unit Status (active/suspended), Rental Status (rented/available), and Services (count with tooltip)
        - GET endpoint `/api/external-units/:id/services` returning configured payment schedules for each unit with parallel fetching
        - Visual toggle buttons with Power/PowerOff icons and descriptive tooltips
        - Comprehensive filtering by unit status, rental status, and condominium
        - Color-coded badges with semantic icons (Power, PowerOff, DoorClosed, DoorOpen, Key)
        - Audit logging of all status changes with user tracking
    *   **Check-Out Reporting System**: Comprehensive checkout workflow for completed rental contracts with security deposit management. Features include:
        - Security deposit field in rental contracts for tracking refundable amounts
        - Check-out report creation with draft/completed workflow states
        - **Inventory Assessment**: Dynamic inventory item tracking with condition notes and validation
        - **Maintenance Deductions**: Issue tracking with associated costs, automatic deduction calculation from security deposit
        - **Cleaning Verification**: Area-by-area cleaning status tracking with detailed notes
        - **Automatic Refund Calculation**: Real-time computation of security deposit refund (deposit minus maintenance costs)
        - Tab-based UI for organizing inventory, maintenance, and cleaning sections
        - Draft-save functionality for incomplete reports with completion workflow
        - Report completion confirmation with refund amount preview
        - Read-only mode for completed reports preserving historical data
        - Multi-tenant security with agency ownership validation on all operations
        - Integration with contract detail page showing check-out button for completed contracts only
        - RESTful API endpoints: GET (by contract/id/agency), POST (create), PATCH (update), DELETE, POST /complete (finalize)
        - Audit logging of all check-out report operations

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