# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive SaaS platform for real estate property management, primarily focused on the Tulum, Quintana Roo market. It supports various user roles (master, admin, seller, owner, client) to manage properties, schedule appointments, create client presentations, coordinate services, and process offers. The platform aims to streamline property management operations, enhance user experience with a professional, data-dense dashboard, and includes features like role-based access control, Google Calendar integration, a service provider marketplace, property submission with digital agreement signing, and a full back office for offer management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

### Navigation Updates
- Removed "Mis" (my) prefix from Spanish navigation items:
  - "Mis Citas" → "Citas"
  - "Mis Favoritos" → "Favoritos"
  - "Mis Oportunidades" → "Oportunidades"
- English translations updated accordingly (Appointments, Favorites, Opportunities)

### Review System Implementation
- Complete database schema for bidirectional reviews
- RESTful API endpoints for all review types
- Storage layer methods with filtering capabilities
- See TEST_ACCOUNTS.md for detailed role-based review functionality

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing and TanStack Query for server state management. UI components are developed with Radix UI primitives and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes and internationalization (Spanish/English). It features a professional design system and role-switching capabilities.

### Backend

The backend utilizes Node.js with Express.js and TypeScript (ESM modules), providing a RESTful API with role-based middleware and JSON-based error handling. It implements a dual authentication system: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage

The application uses PostgreSQL (Neon serverless) and Drizzle ORM for type-safe interactions. The schema supports user management, property statuses, appointment scheduling, client presentation cards, service providers, offer workflows, and staff assignments, with audit logs for critical actions. A lead capture system tracks user actions and manages rental opportunity requests. A dedicated `condominiums` table manages approved condominium listings with a three-state approval workflow.

#### Review System (October 2025)
A comprehensive bidirectional review system enables feedback between users:
- **Property Reviews**: Clients rate properties (1-5 stars) with optional comments
- **Appointment Reviews**: Clients review appointment experiences
- **Concierge Reviews**: Clients rate concierge service quality
- **Client Reviews**: Concierges provide feedback on client interactions

Review tables: `property_reviews`, `appointment_reviews`, `concierge_reviews`, `client_reviews`

### Key Features and Workflows

*   **Property Management**: Includes a property approval workflow, owner-submitted change requests, and owner settings for appointment auto-approval. All properties are standardized to Tulum location. Sublease functionality is supported with search filters.
*   **Property Submission**: A multi-step wizard with automatic draft saving, digital agreement signing using admin-managed templates, and audit logging. Integration with approved condominium listings.
*   **Condominium Workflow**: User-requested condominiums require admin approval. The system includes 396 pre-approved Tulum condominiums.
*   **Client Dashboard**: A comprehensive overview for clients with personalized welcome, quick stats (appointments, favorites, opportunities, viewed properties), quick actions, and conditional sections. Includes appointment management with Google Calendar integration.
*   **User Experience**: Features an Airbnb-style role switching, full i18n support with language persistence across authentication, a WebSocket-based real-time chat system with secure authentication, enhanced presentation cards, granular email notification preferences, and device-based profile picture uploads.
*   **Public Dashboard**: An Airbnb-inspired design adapting for authenticated vs. non-authenticated users, with dual pricing support (rental/sale), improved property listing displays, and advanced search filters (property type, colony, condominium name).
*   **Virtual Assistant (MARCO)**: An intelligent, humanized chatbot named MARCO that guides clients through property search, suggests presentation cards, and coordinates appointments. It's configurable by admins (name, prompt, welcome, active status) and uses OpenAI GPT-5. Chatbot is internationalized (Marco-IA/Marco-AI).
*   **Referral System**: Secure, role-based referral filtering ensures users only see their own referrals, with admins having full visibility.
*   **Welcome Modals**: First-time welcome modals for clients and property owners to introduce features, controlled by a `hasSeenWelcome` flag.
*   **Service Provider Messaging**: One-click chat initiation with service providers from their directory listings.
*   **Review System**: Bidirectional feedback system allowing clients to review properties, appointments, and concierges, while concierges can review clients. API endpoints: `/api/reviews/{properties|appointments|concierges|clients}` with GET/POST methods.

### System Design Choices

The platform uses unified middleware for consistent authentication handling, automatic logging for auditing, and a public dashboard that adapts its experience based on user authentication. A calendar view for appointments and detailed user profiles are included. WebSocket security for real-time chat implements session-based authentication, per-conversation authorization, and secure connection handling.

## External Dependencies

*   **Google Calendar API**: For event creation and management.
*   **Neon Database**: Serverless PostgreSQL.
*   **Replit Auth**: OpenID Connect provider for user authentication.
*   **Resend API**: For email notifications.
*   **Radix UI**: Primitive component library.
*   **Lucide React**: Icon library.
*   **date-fns**: Date manipulation.
*   **react-day-picker**: Calendar component.
*   **Zod**: Runtime type validation.
*   **WebSocket (ws)**: Server-side WebSocket implementation.
*   **cookie**: Cookie parsing.
*   **OpenAI GPT-5**: For the MARCO virtual assistant.