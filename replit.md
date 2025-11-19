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
Utilizes PostgreSQL (Neon serverless) with Drizzle ORM for type-safe interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, rental contracts, and external property management (agencies, properties, contracts, payment schedules, payments, maintenance tickets).

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