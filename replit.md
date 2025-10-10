# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers extensive features including property management, dual-type appointment scheduling with a concierge system, client presentations, service coordination, and offer processing with a counter-negotiation system. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. Its ambition is to dominate the Tulum real estate market by leveraging enhanced commission systems, marketing automation, preventive maintenance, referral tracking, and AI-powered features for predictive analytics, automated legal document generation, and intelligent tenant screening.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a modern web stack, emphasizing a professional, responsive, and accessible user experience with full internationalization.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are crafted with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. All forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation. The entire platform is **fully optimized for mobile devices** with responsive spacing patterns: mobile-first design using `px-3 sm:px-4`, `py-2 sm:py-3`, `space-y-4 sm:space-y-6`, `gap-3 sm:gap-4`, and `text-2xl sm:text-3xl` for headers.

**Cache Invalidation Best Practices**: The platform uses a robust cache invalidation strategy with React Query. A helper function `invalidateRelatedQueries(baseUrl)` is available in `client/src/lib/queryClient.ts` to automatically invalidate all queries matching a base URL pattern. This ensures UI updates immediately after mutations (create, update, delete operations) without requiring page reloads. Example usage: `invalidateRelatedQueries('/api/users')` invalidates all user-related queries.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for general users and local username/password for administrators. Session management and user approval workflows are integral. Centralized OpenAI service integration utilizes the GPT-4 model. All contract routes implement strict Zod validation with insertContractTenantInfoSchema and insertContractOwnerInfoSchema, data sanitization via sanitizeObject(), and role-based authorization allowing tenant, owner, and admin (master/admin/admin_jr) access for verification workflows.

### Data Storage
PostgreSQL (Neon serverless) with Drizzle ORM provides type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling (including concierge assignments and blocked slots), client presentation cards, service providers, offer workflows (including counter-offers and rental opportunity requests), staff assignments, audit logs, lead capture, and a `condominiums` table with a three-state approval workflow. It also features a bidirectional review system, financial tracking, payout management, and a comprehensive rental contract system with automated calculations and digital signature tracking. An automatic error tracking system logs errors and notifies administrators. Performance is optimized with B-tree indexes, and security includes authorization auditing and role validation. Key entities include Condominiums, Colonies, Amenities, Property Features, Commission Advances, Service Favorites, Predictive Analytics, Legal Documents, Tenant Screenings, Marketing Campaigns, Maintenance Schedules, Rental Payments, Tenant Maintenance Requests, and enhanced Chat Conversations with `rentalContractId`.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication status. WebSocket-based real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint facilitates role switching for testing purposes.

### Key Features
*   **Role-Based Access Control**: Granular permissions across all user types.
*   **Advanced Appointment System**: Dual-type scheduling (individual/tour) with a concierge assignment workflow, dynamic slot availability based on concierge availability, and post-appointment client features (concierge contact, chat, map, reviews).
*   **Property Management Lifecycle**: Features property approval workflows, owner change requests, sublease functionality, comprehensive photo editing, and a 5-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking with receipt proofs, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers on visited properties, followed by a bidirectional counter-offer negotiation system with a maximum of 3 rounds. Administrators can grant rental opportunities directly to clients without requiring a prior appointment (POST /api/admin/rental-opportunity-requests/grant). Client opportunities page (/mis-oportunidades) streamlined to show only "Propiedades Visitadas" and "Mis Ofertas" tabs.
*   **Contract Elaboration System**: Automated workflow triggered after offer acceptance. Client completes tenant information form (personal data, guarantor, references, documents). Owner completes property owner form (banking details, property documents, terms). Admin verifies documents (48-72hrs). Lawyer (abogado) elaborates legal PDF contract and uploads for review. Tripartite chat enables discussions between lawyer, client, and owner for term negotiations. Client and owner approve or request changes. Upon approval, check-in appointment is scheduled. Digital signatures collected during check-in. Contract progresses through statuses: draft → apartado → firmado → check_in → activo. Database tables: rental_contracts, contract_tenant_info, contract_owner_info, contract_legal_documents, contract_term_discussions, contract_approvals, check_in_appointments, contract_signed_documents.
    - **Contract UI Enhancement**: Both client (/active-rentals) and owner (/owner/active-rentals) views now feature tabbed interfaces separating "Contratos en Proceso" from "Rentas Activas". Visual progress indicators with color-coded badges (gray: draft, yellow: apartado, blue: firmado, purple: check_in, green: activo) show contract status at a glance. Alert banners notify users of pending actions: clients see alerts for draft status contracts requiring tenant information, owners see alerts for apartado status contracts requiring property owner information. Each contract card includes quick action buttons to navigate directly to the required forms.
*   **HOA (Homeowners Association) Module**: Complete condominium management system with four main database tables (condominium_units, condominium_fees, condominium_fee_payments, condominium_issues). Backend implements strict security with requireRole middleware and 404 validation before mutations. Frontend features:
    - **Admin Dashboard** (/admin/hoa): Read-only condominium management interface with unit, fee, and issue visualization. Selector-based navigation with visual statistics and distribution charts. Accessible to admin, master, and management roles.
    - **Owner Portal** (/owner/hoa): Self-service interface for owners to view their units, manage maintenance fees, and report common area issues. Features tabbed navigation (Fees, Units, Issues) with payment tracking and validated issue reporting using react-hook-form with zodResolver and insertCondominiumIssueSchema. All interactive elements include descriptive data-testid attributes for testing and accessibility.
*   **HOA Manager System**: Professional condominium management system with dedicated HOA Manager role and comprehensive announcement system. Database tables: hoa_manager_assignments (with pending/approved/rejected/suspended statuses), hoa_announcements (with draft/published states and expiration), hoa_announcement_reads (tracking owner engagement). Backend features:
    - **Assignment Workflow**: Users request HOA manager assignment via Profile page (/perfil) using RequestHoaManagerDialog component. Dialog displays dropdown of approved condominiums (fetched from GET /api/condominiums?approvalStatus=approved). Users select specific condominium and optionally add notes. Admin approves, rejects, or suspends assignments. Each HOA Manager is scoped to ONE specific condominium selected during request. Only approved, non-suspended managers can create announcements.
    - **UI Components**: RequestHoaManagerDialog integrated in Profile page under "Solicitudes de Roles" section. Form validated with react-hook-form and Zod (insertHoaManagerAssignmentSchema). Success invalidates ["/api/hoa-manager/my-assignments"] query.
    - **Security**: Multi-layer authorization checks verify approved manager status before any announcement operations. Owners can only mark announcements as read if they own units in the condominium. All announcement visibility respects condominium boundaries.
    - **API Routes**: POST /api/hoa-manager/assignments (request assignment), GET /api/hoa-manager/my-assignments, POST /api/hoa-manager/assignments/:id/approve|reject|suspend (admin only), POST /api/hoa-manager/announcements (create), PATCH /api/hoa-manager/announcements/:id (update), POST /api/hoa-manager/announcements/:id/publish, DELETE /api/hoa-manager/announcements/:id, POST /api/hoa-manager/announcements/:id/read (owner marks as read), GET /api/hoa-manager/my-unread-announcements (owner's unread).
    - **Audit Logging**: All assignment and announcement operations create audit logs with user, action, and details.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security feature (5 minutes of inactivity) for all authenticated users.

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