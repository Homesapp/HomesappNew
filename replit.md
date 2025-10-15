# HomesApp - Smart Real Estate

## Overview
HomesApp is a comprehensive SaaS platform for smart real estate property management in Tulum, Quintana Roo, supporting multiple user roles (master, admin, seller, owner, client, lawyer). It offers features for property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with robust role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a powerful back office. Its strategic ambition is to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI-powered functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
The frontend utilizes React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, supporting light/dark themes. Forms are managed with Shadcn Form, `useForm`, and `zodResolver`, employing Zod for validation. A mobile-first design approach is implemented.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, offering a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication mechanisms: Replit Auth (OpenID Connect) for general users and local username/password for administrators, alongside direct Google OAuth. Session management, user approval workflows, and centralized OpenAI service integration (GPT-4 model) are core functionalities. Contract routes feature strict Zod validation, data sanitization, and role-based authorization.

### Data Storage
PostgreSQL, provided by Neon serverless, is used with Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a robust rental contract system. Performance is enhanced with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard dynamically adapts content based on user authentication status. Real-time chat is implemented via WebSockets with session-based authentication and per-conversation authorization. A development-only authentication endpoint is available for testing role-switching functionalities.

Key features include:
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and manual property entry.
*   **Property Management Lifecycle**: Features property approval workflows, two-stage publication, owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA Module**: Complete condominium management system for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Full-featured system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation, and quick actions, with advanced table view features.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security.

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

## Security Audit - Access Control Verification (October 15, 2025)

### Comprehensive verification of role-based access control across all major system endpoints.

### ✅ Verified Secure Endpoints

**Leads (CRM):**
- `GET /api/leads` - Sellers use `getLeadsForSeller(userId)` with SQL: `WHERE (registeredById = userId OR assignedToId = userId)`
- `GET /api/leads/:id` - Validates sellers can only access leads they registered OR are assigned to
- Admins use `getLeads(filters)` without user restrictions - correctly see all leads

**Properties:**
- `GET /api/owner/properties` - Filters by `ownerId = userId`, owners only see their properties
- `GET /api/owner/properties/:id` - Verifies `property.ownerId === userId`
- `GET /api/properties/:propertyId/documents` - Validates: isOwner OR isAdmin OR isAssignedStaff
- Public endpoints (`/api/properties`, `/api/properties/:id`) correctly show only approved/published to unauthenticated users

**Offer Tokens:**
- `GET /api/offer-tokens` - Restricted to admins only with `requireRole(["admin", "master", "admin_jr"])`
- `GET /api/offer-tokens/:token/validate` - Public route (correct for client validation)

### 🔒 Security Fixes Implemented

**1. Offers Endpoint (CRITICAL FIX):**
- **Issue:** `GET /api/offers` accepted `clientId` parameter without validation - clients could view other clients' offers
- **Fix (lines 11083-11118):** Added role-aware filtering:
  - Clients: Force `filters.clientId = userId` (can only see own offers)
  - Admins/Masters/Sellers: Can filter by any clientId
  - Returns 403 if client attempts to access others' data

**2. Appointments Endpoint (CRITICAL FIX):**
- **Issue:** `GET /api/appointments` accepted `clientId` parameter without validation - clients could view other clients' appointments
- **Fix (lines 8713-8742):** Added identical role-aware filtering:
  - Clients: Force `filters.clientId = userId` (can only see own appointments)
  - Admins/Masters/Sellers: Can filter by any clientId
  - Returns 403 if client attempts to access others' data

**3. Owner Offer Management:**
- `GET /api/owner/offers` - Uses `getOffersByOwner(userId)` to filter offers for owner's properties
- `PATCH /api/owner/offers/:id/accept` - Verifies `property.ownerId === userId`
- `POST /api/client/offers/:id/counter-offer` - Verifies `offer.clientId === userId`

### Architecture Review Findings
- Both security fixes are localized to filter preparation
- No new data fetch loops introduced
- Reuses existing enrichment logic - no performance risk
- Recommended next steps:
  1. Add regression tests for client vs admin query behavior
  2. Monitor logs for unexpected 403 responses
  3. Document access expectations for frontend consumers

### Summary
All critical endpoints now enforce proper role-based access control. Clients are restricted to their own data, while admins/sellers retain full access. Two critical vulnerabilities were identified and fixed in offers and appointments endpoints.