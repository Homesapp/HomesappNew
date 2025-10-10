# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed for real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client) and offers extensive features including property management, dual-type appointment scheduling with a concierge system, client presentations, service coordination, and offer processing with a counter-negotiation system. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing, and a robust back office. Its ambition is to dominate the Tulum real estate market by leveraging enhanced commission systems, marketing automation, preventive maintenance, referral tracking, and AI-powered features for predictive analytics, automated legal document generation, and intelligent tenant screening.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a modern web stack, emphasizing a professional, responsive, and accessible user experience with full internationalization.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are crafted with Radix UI and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes. All forms use Shadcn Form, `useForm`, and `zodResolver` with Zod for validation.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for general users and local username/password for administrators. Session management and user approval workflows are integral. Centralized OpenAI service integration utilizes the GPT-4 model.

### Data Storage
PostgreSQL (Neon serverless) with Drizzle ORM provides type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling (including concierge assignments and blocked slots), client presentation cards, service providers, offer workflows (including counter-offers and rental opportunity requests), staff assignments, audit logs, lead capture, and a `condominiums` table with a three-state approval workflow. It also features a bidirectional review system, financial tracking, payout management, and a comprehensive rental contract system with automated calculations and digital signature tracking. An automatic error tracking system logs errors and notifies administrators. Performance is optimized with B-tree indexes, and security includes authorization auditing and role validation. Key entities include Condominiums, Colonies, Amenities, Property Features, Commission Advances, Service Favorites, Predictive Analytics, Legal Documents, Tenant Screenings, Marketing Campaigns, Maintenance Schedules, Rental Payments, Tenant Maintenance Requests, and enhanced Chat Conversations with `rentalContractId`.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard adapts based on user authentication status. WebSocket-based real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint facilitates role switching for testing purposes.

### Key Features
*   **Role-Based Access Control**: Granular permissions across all user types.
*   **Advanced Appointment System**: Dual-type scheduling (individual/tour) with a concierge assignment workflow, dynamic slot availability based on concierge availability, and post-appointment client features (concierge contact, chat, map, reviews).
*   **Property Management Lifecycle**: Features property approval workflows, owner change requests, sublease functionality, comprehensive photo editing, and a 5-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking with receipt proofs, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers on visited properties, followed by a bidirectional counter-offer negotiation system with a maximum of 3 rounds.
*   **Contract Elaboration System**: Automated workflow triggered after offer acceptance. Client completes tenant information form (personal data, guarantor, references, documents). Owner completes property owner form (banking details, property documents, terms). Admin verifies documents (48-72hrs). Digital signatures collected. Contract progresses through statuses: draft → apartado → firmado → check_in → activo. Database tables: rental_contracts, contract_tenant_info, contract_owner_info.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **Operational Efficiency**: Marketing automation, preventive maintenance scheduling, enhanced referral tracking, and comprehensive admin CRUD systems.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, and granular email notification preferences.

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