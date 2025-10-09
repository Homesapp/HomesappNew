# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client) and offers features like property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform provides a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing, and a robust back office for offer management. It aims to dominate the Tulum real estate market through enhanced commission systems, marketing automation, preventive maintenance, referral tracking, and AI-powered features for predictive analytics, automated legal document generation, and intelligent tenant screening.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI components are built with Radix UI and Shadcn/ui, styled with Tailwind CSS, and support light/dark themes and i18n (Spanish/English). The design emphasizes professionalism, role-switching, comprehensive error handling, loading states, full i18n support, testing attributes, and responsive design with accessibility features. All forms utilize shadcn Form + useForm + zodResolver with Zod validation.

### Backend
The backend is built with Node.js, Express.js, and TypeScript (ESM), providing a RESTful API. It features role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for regular users and local username/password for administrators. Session management and user approval workflows are included. OpenAI service integration is centralized, utilizing the GPT-4 model.

### Data Storage
PostgreSQL (Neon serverless) and Drizzle ORM are used for type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, a `condominiums` table with a three-state approval workflow, and a bidirectional review system. Financial tracking, payout management, and a comprehensive rental contract system handle commissions, referrals, and rental income with automated calculations and digital signature tracking. An automatic error tracking system captures frontend and backend errors, logging them to the database and notifying administrators. Performance is optimized with 20 B-tree indexes, and security enhancements include authorization auditing and role validation.

Key schema entities include:
- **Condominiums**: Linked to colonies.
- **Colonies**: Standalone entities.
- **Amenities**: Property or condominium specific.
- **Property Features**: Custom characteristics.
- **Commission Advances**: Tracks seller requests.
- **Service Favorites**: Links users to preferred providers.
- **Predictive Analytics**: Stores analysis, predictions, confidence.
- **Legal Documents**: Stores document type, content, metadata.
- **Tenant Screenings**: Stores application data, AI analysis, risk scores.
- **Marketing Campaigns**: Stores message templates, targeting.
- **Maintenance Schedules**: Tracks property linking, tasks, frequency.
- **Rental Payments**: Tracks service-based payments (rent, electricity, water, internet, gas, maintenance, other) with status, device-uploaded receipt proofs, and owner approval workflow (approvedBy, approvedAt fields).
- **Tenant Maintenance Requests**: Client-submitted requests with title, description, urgency, and photo documentation (base64 encoded).
- **Chat Conversations**: Enhanced with rentalContractId for rental-specific chats with automatic participant enrollment (tenant, owner, maintenance staff).
- **Appointments**: Extended with concierge assignment fields (conciergeId, accessType, accessCode, accessInstructions, conciergeAssignedBy, conciergeAssignedAt) for property access coordination.
- **Concierge Blocked Slots**: Tracks concierge unavailability periods to calculate accurate appointment slot availability.

### Key Features and Workflows
*   **Role-Based Access**: Granular control for master, admin, seller, owner, and client roles, including role-based income and appointment page enhancements.
*   **Appointment Scheduling**: Dual-type (individual/tour) with configurable business hours, Calendly-style 4-step wizard interface, reschedule workflow, and client limits (1 per day).
*   **Concierge-Based Appointment System**: Dynamic appointment slot availability determined by the number of approved concierges with available time (not blocked or booked). Owners and admins can assign concierges to appointments with property access credentials:
    - **Access Types**: Lockbox (with code), Electronic Lock (with code), Manual (instructions only), Other (custom)
    - **Owner Workflow**: Select concierge from available list, provide access type and credentials, send assignment
    - **Admin Workflow**: Can assign concierges to any appointment regardless of owner approval status
    - **Automated Notifications**: Client receives confirmation with property address, time, and concierge info; Owner receives assignment confirmation; Concierge receives appointment details with location and access instructions; Admins receive assignment notification
    - **Slot Availability Logic**: Available slots = approved concierges count minus those with blocked time slots minus those with existing appointments at that time. System checks for time overlap (individual appointments = 60 min, tour appointments = 30 min) to prevent double-bookings
    - **Blocked Slot Management**: Concierges and admins can create time blocks to mark unavailability periods. The system validates against these blocks when calculating slot availability, ensuring accurate scheduling. Blocked slots have start/end times and are checked for overlap with requested appointment times
*   **Property Management**: Property approval workflow, owner change requests, sublease functionality, pet-friendly indicators, custom listing titles, and enhanced photo gallery with a complete photo editing system (add, delete, reorder, cover image selection, admin approval workflow). All listings use `primaryImages`.
*   **Property Staff & Task Management**: System for assigning staff to properties with role-based assignments and task tracking.
*   **Property Submission**: A 5-step wizard with draft saving, digital agreement signing, and integration with approved condominiums.
*   **Dashboard Enhancements**: Personalized Client Dashboard with stats and quick actions. Comprehensive Owner Dashboard with automated financial reporting and preventive maintenance calendar.
*   **User Experience**: Airbnb-style role switching, full i18n support, WebSocket-based real-time chat, enhanced presentation cards, and granular email notification preferences.
*   **Notification System**: Dual-channel (in-app and email) with configurable categories and SLA tracking.
*   **Admin CRUD System**: Full management for condominiums, colonies, amenities, property features, and property drafts.
*   **Automatic Error Tracking**: Comprehensive monitoring for frontend and backend errors.
*   **Property Limit System**: Owner property count control with request/approval workflow.
*   **Enhanced Commission System**: Includes commission advances for sellers and role-based commission structures.
*   **Enhanced Service Provider Marketplace**: Features service favorites and expanded bidirectional reviews.
*   **AI-Powered Features (OpenAI GPT-4/GPT-5)**: Predictive analytics for rental probability/price recommendations, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO).
*   **Marketing Automation**: Campaign management, audience segmentation, performance tracking, and scheduling.
*   **Preventive Maintenance System**: Scheduling, task tracking, and automated reminders.
*   **Enhanced Referral Tracking**: Automatic commission attribution and performance analytics, including bank account integration for payments.
*   **Active Rentals Management**: Comprehensive portals for clients and owners with:
    - Service-based payment tracking (rent, electricity, water, internet, gas) with device-uploaded receipt proofs (images, 10MB limit)
    - Owner payment approval system with service-filtered tabs and approve/pending workflow
    - Link to property listing from active rental cards (ExternalLink icon)
    - Maintenance requests with title, description, urgency, and photo documentation (device-only, base64, 10MB limit)
    - Real-time chat system connecting tenant, owner, and maintenance staff via WebSocket
    - Property information display (title, condominium/unit or house name)

### System Design Choices
The platform utilizes unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication. WebSocket security for real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint (`/api/auth/test/set-role`) allows role switching for testing.

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