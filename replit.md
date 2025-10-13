# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client, lawyer) and offers features such as property management, appointment scheduling with a concierge system, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a robust back office. Its ambition is to dominate the Tulum real estate market through enhanced commission systems, marketing automation, predictive analytics, and AI-powered features.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)
*   **Property Title Standardization**: Major refactoring to eliminate custom property titles. All properties now use "CONDOMINIO - UNIDAD" format throughout the application.
    - Database schema updated: removed `title` and `customListingTitle` columns, made `condominiumId` and `unitNumber` required (NOT NULL)
    - Created centralized `getPropertyTitle()` helper function in `client/src/lib/propertyHelpers.ts` for consistent title formatting
    - Updated PropertyFormDialog with cascading condominium/unit selectors instead of title input
    - Updated all main property display views: Properties, PropertyDetails, PropertySearch, Dashboard, PublicDashboard, PropertyFullDetails, RentalsKanban
    - Imported comprehensive location data: 31 colonies, 403 condominiums, 916 units from Tulum real estate inventory (DEVELOPMENT database only)

*   **Admin Panel Property Management Improvements** (October 13, 2025):
    - Fixed PATCH/DELETE property endpoints to correctly handle admin sessions (`req.session.adminUser`) alongside regular user sessions
    - Added View, Edit, Delete, and Schedule action buttons to AdminPropertyManagement page
    - Created `POST /api/colonies/ensure` endpoint for automatic colony creation with admin auto-approval
    - Converted location field from Input to CreatableCombobox, allowing users to select existing colonies or create new ones on-the-fly
    - Fixed TypeScript errors in PropertyFormDialog apiRequest calls (changed from incorrect object parameter format to proper method/url/data format)
    - Updated master admin password to "Homesapp!!" (bcrypt hash: $2b$10$GjxVilmWDxj5FbhNu5QkEu9hVKO8yXqgG9S4WERntfovo6Gx28bd2)

*   **Lead Creation Form Fixes** (October 13, 2025):
    - Fixed critical issue where "Crear Lead" button was non-functional due to validation errors on backend-managed fields
    - Updated `insertLeadSchema` to omit `registeredById` and `validUntil` fields (these are now auto-populated by the backend)
    - Fixed property selector in MultiStepLeadForm to use `/api/properties/search` endpoint and `getPropertyTitle()` helper
    - Property interests now display correctly with "CONDOMINIO - UNIDAD" format in both selector and selected badges
    - Changed budget input from `type="number"` to `type="text"` to align with string-based schema validation

*   **Lead Edit and Delete Functionality** (October 13, 2025):
    - Added Edit and Delete buttons to Lead Details dialog header for quick access to lead management
    - Implemented updateLeadMutation with proper state management and cache invalidation
    - Implemented deleteLeadMutation with AlertDialog confirmation flow to prevent accidental deletions
    - Modified MultiStepLeadForm to support edit mode via defaultValues prop - preserves all fields including status, pets, and multi-select arrays
    - Fixed POST /api/leads endpoint to work with admin sessions by normalizing admin user objects (from storage.getAdminById) to match regular user shape
    - Edit dialog title dynamically changes between "Crear Nuevo Lead" and "Editar Lead" based on context
    - All interactive elements have proper data-testid attributes for testing (button-edit-lead, button-delete-lead, dialog-delete-confirmation)

*   **Lead Form Auto-Submit Bug Fix** (October 13, 2025):
    - Fixed critical bug where leads were auto-created when reaching Step 3 without explicit user action
    - Added guard in handleSubmit() to prevent form submission on steps 1 and 2 (only allows submit when currentStep === STEPS.length)
    - Maintains proper form accessibility including keyboard (Enter key) submission on final step
    - Changed DELETE /api/leads/:id endpoint permissions from requireFullAdmin to requireRole(["master", "admin", "admin_jr", "seller", "management"]) to allow sellers and management to delete leads

*   **Appointments with Unregistered Leads** (October 13, 2025):
    - Modified appointments schema to support leads without user accounts:
      - Made `clientId` nullable (previously required NOT NULL)
      - Added optional fields: `leadId`, `leadEmail`, `leadPhone`, `leadName` for non-registered leads
      - Added Zod validation requiring either `clientId` OR (`leadEmail` AND `leadName`)
    - Updated POST `/api/seller/appointments/create-with-lead` endpoint:
      - Now accepts leads without `userId` (no longer returns 400 error)
      - Uses lead contact info (`leadId`, `leadEmail`, `leadPhone`, `leadName`) when lead is not registered
      - Skips notification creation for non-registered leads (only notifies registered users)
    - Enhanced appointment deletion permissions:
      - Added `admin_jr` to global resource access list in requireResourceOwnership middleware
      - Sellers and management can now delete appointments associated with their leads (verified via `leadId` and `registeredById` match)
      - Property owners, clients, and assigned staff retain their deletion rights

## System Architecture
The platform is built with a modern web stack, emphasizing a professional, responsive, and accessible user experience with full internationalization.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. Forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation. The platform is optimized for mobile devices with a mobile-first design approach.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for general users and local username/password for administrators, alongside direct Google OAuth. Session management and user approval workflows are integral. Centralized OpenAI service integration utilizes the GPT-4 model. Contract routes implement strict Zod validation, data sanitization, and role-based authorization for verification workflows.

### Data Storage
PostgreSQL (Neon serverless) with Drizzle ORM provides type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a comprehensive rental contract system. Performance is optimized with B-tree indexes, and security includes authorization auditing and role validation.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication status. WebSocket-based real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint facilitates role switching for testing purposes.

### Key Features
*   **Role-Based Access Control**: Granular permissions across all user types with admin direct role assignment capability.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment, dynamic slot availability, and manual property entry for properties not yet in the database.
*   **Property Management Lifecycle**: Features property approval workflows with a two-stage publication system (`approvalStatus` and `published` boolean), owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with private owner data collection and digital agreement signing. Includes the ability to mark properties as "featured."
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA (Homeowners Association) Module**: Complete condominium management system for admin, owner, and HOA Manager roles, including unit, fee, issue management, and an announcement system.
*   **Comprehensive Notification System**: Full-featured notification system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline, multi-step lead creation form, sales funnel visualization, and quick actions on lead cards. Supports CSV contact import with intelligent parsing for bulk property updates.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and auto-logout security feature.

## External Dependencies
*   Google Calendar API
*   Gmail API
*   Google OAuth 2.0 (direct authentication via passport-google-oauth20)
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