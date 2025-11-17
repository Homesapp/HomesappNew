# HomesApp - Smart Real Estate

## Overview
HomesApp is a comprehensive SaaS platform for smart real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers features for property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with robust role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a powerful back office. Its strategic ambition is to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI-powered functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, supporting light/dark themes. Forms are managed with Shadcn Form, `useForm`, and `zodResolver`, employing Zod for validation. A mobile-first design approach is implemented.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, offering a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication mechanisms (Replit Auth/OpenID Connect, local username/password, Google OAuth). Session management, user approval workflows, and centralized OpenAI service integration (GPT-4 model) are core functionalities. Contract routes feature strict Zod validation, data sanitization, and role-based authorization.

### Data Storage
PostgreSQL, provided by Neon serverless, is used with Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a robust rental contract system. Performance is enhanced with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard dynamically adapts content based on user authentication status. Real-time chat is implemented via WebSockets with session-based authentication and per-conversation authorization. 

**Development-Only Testing Endpoints:**
- `/api/auth/test/set-role`: Role-switching for authenticated users (requires OIDC auth first)
- `/api/test-auth/admin-session`: Bootstrap admin session without OIDC for e2e testing (creates/reuses `test-admin` user, strictly development-only)

Key features include:
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and manual property entry.
*   **Property Management Lifecycle**: Property approval workflows, two-stage publication, owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with digital agreement signing. Admin property editing via 7-step wizard showing current vs. new values with comprehensive null-safe field handling. Property details view with photo download (individual/ZIP), URL copy functionality, and expanded owner information display.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA Module**: Complete condominium management system for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Full-featured system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation, and quick actions, with advanced table view features.
*   **Referral System**: Sellers can refer property owners and earn 20% commission per referred property.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security.
*   **Public Rental Form**: Comprehensive 8-step wizard for tenants to submit rental applications with guarantor option, featuring bilingual support (Spanish/English) including 13 legal sections of Terms & Conditions, Zod validation with `z.preprocess`, and conditional guarantor forms. Includes robust frontend and backend validation for integer fields to prevent overflow errors.
*   **Property Invitation Token System**: Secure token-based property submission system allowing admins to generate time-limited, single-use invitation links for property owners to submit properties without creating accounts. Features include:
    - 24-hour expiring tokens with UUID generation
    - Optional metadata capture (email/phone of invitee)
    - Public submission endpoints with comprehensive security validations
    - Token ownership verification preventing draft hijacking
    - Single-use enforcement: tokens remain valid during wizard completion but marked used upon final submission
    - Draft age restrictions (48-hour limit)
    - Cache isolation between authenticated and public sessions
    - Admin UI for token generation with copy-to-clipboard functionality
    - Management page at `/admin/property-invitations` to view all generated links with status tracking, copy functionality, and WhatsApp sharing
    - Bilingual support (Spanish/English) for all invitation-related UI
    - **Bug fixes (2025-11-17)**:
      - Corrected token validation in public endpoints to use `getPropertySubmissionTokenByToken()` for proper token string lookup
      - Fixed draft property display: corrected field mapping in `/api/admin/properties` endpoint to read `bedrooms`, `bathrooms`, `area` from `draft.details` (not `draft.basicInfo`) and `price` from `draft.basicInfo.price` (not `rentPrice`)
      - Fixed draft approval: automatic owner user creation/lookup when approving invitation-based drafts (searches by email/phone, creates new propietario user if not found)
      - Expanded draft transformation to include all fields: accessInfo, amenities (with name lookup), includedServices, videos, virtualTourUrl, owner contact data
      - Fixed amenities display: batch lookup of amenity names by IDs to show readable names instead of UUIDs
      - Fixed services display: corrected mapping from `servicesInfo.basicServices` to `includedServices` structure
      - Added services NOT included with cost information: displays water, electricity, internet, gas costs when not included in rent
      - Added condominium amenities display: shows amenities specific to the condominium if available
      - Fixed image gallery: now displays ALL images (primary + secondary) with duplicate removal
      - Added bulk image download: one-click ZIP download of all property images with proper naming
      - Google Maps link: already displayed in multimedia section when available
*   **Sidebar Menu Visibility Control**: Admin configuration system allowing master and admin users to control sidebar menu item visibility for specific roles. Features include:
    - Database-driven visibility configuration per role and menu item
    - Admin UI at `/admin/sidebar-config` with role-based tabs
    - Real-time visibility toggling with automatic persistence
    - AppSidebar integration with react-query for efficient configuration fetching
    - Master and admin roles always see all menu items regardless of configuration
    - Granular control for roles: cliente, propietario, vendedor, conserje, abogado, contador, admin jr
    - Bilingual support (Spanish/English) for all UI elements

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