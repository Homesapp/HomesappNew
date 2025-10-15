# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers extensive features for property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to deliver a professional, data-rich user experience with robust role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a powerful back office. Its strategic ambition is to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI-powered functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October 15, 2025)

### Public Offer Form Lead Auto-Fill Enhancement
*   **Issue - Form Pre-population**: Implemented automatic pre-filling of offer form with lead data
    - **Problem**: When generating offer links from leads, users had to manually re-enter all lead information
    - **Solution**: Backend GET `/api/offer-tokens/:token/validate` now returns lead data if token has associated leadId
    - **Frontend Implementation**: Added useEffect in `PublicOfferForm.tsx` to auto-populate fields:
      - Full name (firstName + lastName)
      - Email address
      - Phone number
      - Contract duration (first option from lead's array)
      - Move-in date (first option from lead's array)
      - Pets information (converts to "si"/"no" and populates pet details)
    - **User Experience**: Form fields pre-filled but still editable, reducing data entry time
    - **Files**: `server/routes.ts`, `client/src/pages/PublicOfferForm.tsx`

*   **Critical Clarification - Dual Offer Management Systems**:
    - **System 1 (Legacy)**: Route `/backoffice` displays offers from `/api/offers` table
    - **System 2 (Public Forms)**: Route `/admin/offers` displays offers from `/api/offer-tokens` table
    - **Important**: Offers submitted via public form appear ONLY in `/admin/offers`, not in `/backoffice`
    - **Recommendation**: Use `/admin/offers` for reviewing public offer form submissions

## Previous Updates (October 14, 2025)

### Public Offer Form Fixes
*   **Issue 1 - Submit Button Disabled Bug**: Fixed critical bug where offer form submission was blocked
    - **Problem**: Submit button was disabled unless user drew a signature, even though signature field is optional per Zod schema
    - **Root Cause**: Button had `disabled={isPending || !hasSignature}` condition that prevented submission without signature
    - **Solution**: Removed `!hasSignature` from disabled condition; button now only disabled during mutation
    - **UX Improvements**: 
      - Changed label from "Firma aquí *" to "Firma aquí (Opcional)"
      - Updated description to clarify "puedes enviar sin firmar"
    - **Impact**: Users can now successfully submit offers without drawing a signature
    - **File**: `client/src/pages/PublicOfferForm.tsx`

*   **Issue 2 - URL Generation Fixed**: Corrected URL generation for offer links and rental form links in production environment
    - **Problem**: Backend was using incorrect environment variable `REPL_SLUG` which caused malformed URLs in production
    - **Solution**: Updated to use `REPLIT_DOMAINS` environment variable as per Replit documentation
    - **Affected Endpoints**: 
      - POST `/api/offer-tokens/:id/send-email` - Now generates correct offer links in production
      - POST `/api/rental-form-tokens/:id/send-email` - Now generates correct rental form links in production
    - **Implementation**: Changed from `process.env.REPL_SLUG` to `process.env.REPLIT_DOMAINS?.split(',')[0]` for production URL base
    - **Fallback**: Added fallback to 'app.replit.dev' if REPLIT_DOMAINS is not available
    - **Impact**: All new generated links will have correct production URLs

*   **Issue 3 - Public Routes Access Fixed**: Public form routes now accessible for both authenticated and unauthenticated users
    - **Problem**: Routes `/offer/:token` and `/rental-form/:token` were only available to unauthenticated users, causing 404 errors when logged-in users clicked shared links
    - **Solution**: Added public form routes to authenticated user router in App.tsx
    - **Implementation**: Routes positioned at top of authenticated Switch to ensure they're always accessible
    - **Impact**: Users can now access offer and rental form links regardless of authentication status

### Admin CRM Lead Management Enhancements
*   **Lead Reassignment System**: Complete workflow for admin to reassign leads between sellers
    - PATCH `/api/leads/:id/reassign` endpoint (admin/master/admin_jr only)
    - Reassignment dialog with seller selection dropdown
    - Real-time cache invalidation for immediate UI updates
    - Automatic closure of lead details dialog after reassignment
*   **Enhanced Lead Details Dialog** (Admin-only features):
    - **Reassign Button**: Allows admin to transfer lead ownership to another seller
    - **Delete Button**: Restricted to admin roles only (sellers cannot delete leads)
    - **Historial de Citas**: Full appointment history using `/api/leads/:id/appointments` endpoint
    - **Propiedades Ofrecidas**: Complete list of properties offered to lead using `/api/leads/:leadId/offered-properties` endpoint
    - Loading states for async data fetching
    - Proper cache invalidation after mutations
*   **Lead Card Visual Improvements**:
    - Seller badge displayed on each lead card (visible to admin only)
    - Shows assigned seller name for easy identification
    - Consistent styling with platform design system
*   **Backend Security**:
    - DELETE `/api/leads/:id` - requireRole(["master", "admin", "admin_jr"])
    - PATCH `/api/leads/:id/reassign` - requireRole(["master", "admin", "admin_jr"])
    - GET `/api/leads/:id/appointments` - requireRole(["master", "admin", "admin_jr", "seller", "management"])
    - GET `/api/leads/:leadId/offered-properties` - requireRole(["seller", "master", "admin", "management"])
*   **Query Optimization**:
    - Per-lead queries only execute when details dialog is open
    - Efficient cache invalidation on reassignment, appointments, and offers
    - Proper TanStack Query key structure for consistent fetching and invalidation

## System Architecture
The platform is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
The frontend utilizes React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are constructed with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. Forms are managed with Shadcn Form, `useForm`, and `zodResolver`, employing Zod for validation. A mobile-first design approach ensures optimization for various devices.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, offering a RESTful API. It incorporates role-based middleware, JSON error handling, and dual authentication mechanisms: Replit Auth (OpenID Connect) for general users and local username/password for administrators, alongside direct Google OAuth. Session management and user approval workflows are core functionalities. Centralized OpenAI service integration leverages the GPT-4 model, and contract routes feature strict Zod validation, data sanitization, and role-based authorization for verification.

### Data Storage
PostgreSQL, provided by Neon serverless, is used with Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a robust rental contract system. Performance is enhanced with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard dynamically adapts content based on user authentication status. Real-time chat is implemented via WebSockets, ensuring session-based authentication and per-conversation authorization. A development-only authentication endpoint is available for testing role-switching functionalities.
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
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation, sales funnel visualization, and quick actions.
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