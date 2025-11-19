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
    *   **External Calendar System**: Displays payments and maintenance tickets for external agencies, with event highlighting, worker assignment details, and statistics.
    *   **Google Calendar Sync Infrastructure**: Backend service for automatic synchronization of maintenance tickets to workers' Google Calendars with detailed event descriptions and email notifications.
    *   **Temporary Credentials Management**: Workflow for secure sharing of temporary user credentials with forced password changes on first login.
    *   **Unit Information Quick-Share System**: One-click copy-to-clipboard for unit information and access controls.
    *   **External Rentals Management**: Comprehensive rental contract dashboard with optimized performance. Features include:
        - Performance-optimized list endpoint using bulk queries (3 total queries for paginated results, avoiding N+1 problem)
        - Pagination support (default limit: 100, max: 500) for handling large datasets
        - Active services display showing rent, electricity, water, internet, gas, and maintenance services
        - Next payment information with due date, amount, and service type
        - Dual view modes: card and table layouts
        - Advanced filtering by status, condominium, and unit number with searchable combobox components
        - Rental cancellation with automatic cleanup of future pending payments
        - Contract detail view with complete overview of services and payment schedules
        - **Contract Editing**: Full CRUD for active rental contracts including tenant information, monthly rent, end date, and notes with backend validation and multi-tenant security
        - **Payment Schedule Management**: Complete CRUD operations for payment schedules (rent, electricity, water, internet, gas, maintenance) with automatic cache invalidation using TanStack Query v5 array-based query keys
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