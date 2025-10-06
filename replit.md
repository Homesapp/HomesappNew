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

### Internationalization Enhancements
- Added comprehensive translations for RoleToggle component (Spanish/English)
  - Role labels: Owner/Propietario, Client/Cliente
  - Mode switching UI: "Cambiar modo"/"Switch mode"
  - Role descriptions and success/error messages
- Fully translated ClientPresentationCard component
  - Card actions: Activate/Activar, Deactivate/Desactivar, Edit/Editar, Delete/Eliminar
  - Property details: bedrooms, bathrooms, amenities
  - Modality labels: Rent/Renta, Sale/Venta, Rent or Sale/Renta o Venta
  - Match counters with proper pluralization
- Complete sidebar internationalization (October 2025)
  - Added 40+ translation keys (sidebar.*) for all menu items and sections
  - All navigation items use titleKey property for consistent translation
  - Section labels fully translated: Principal/Main, Administración/Administration, Servicios/Services
  - Role-based menus properly localized for all user types
- All UI text now properly internationalized

### Sidebar Improvements
- Collapsible sidebar with icon-only mode (uses Shadcn sidebar primitives)
- Logo displays correctly: full logo when expanded, small icon when collapsed
- RoleToggle adapts to sidebar state: full button with text when expanded, icon-only when collapsed
- Help button adapts similarly to sidebar state
- Button sizes consistent across collapsed/expanded states

### Review System Implementation
- Complete database schema for bidirectional reviews
- RESTful API endpoints for all review types
- Storage layer methods with filtering capabilities
- See TEST_ACCOUNTS.md for detailed role-based review functionality

### Promotional Banner Enhancements
- Updated PublicDashboard promotional banners with relevant stock imagery (October 2025)
  - Owner banner: professional property management dashboard image
  - Service provider banner: service team performing maintenance work
  - Affiliate banner: business partnership and referral network concept
- Images now clearly represent each banner's purpose and message

### Bug Fixes
- Fixed toggle-active endpoint for presentation cards to properly toggle state instead of always activating
- Endpoint now checks existing state before toggling, preventing "card not found" errors

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

#### Income Management System (October 2025)
A comprehensive financial tracking and payout management system for commissions, referrals, and rental income:

**Database Schema**:
- `rentalCommissionConfigs`: Defines commission percentages for properties/users (admin-managed)
- `accountantAssignments`: Scopes which properties/users each accountant manages (property-specific or user-specific)
- `payoutBatches`: Groups multiple transactions for batch processing with workflow states (draft→approved→paid)
- `incomeTransactions`: Individual payment records with categories (referral_client, referral_owner, rental_commission, other_income)

**Enums**: `incomeCategory`, `payoutBatchStatus` (draft/approved/rejected/paid/cancelled), `assignmentType` (property/user)

**Access Control**:
- **Accountants**: Limited scope based on assignments; can create transactions/batches only for assigned properties/users
- **Admins**: Full access to all transactions, batch approval workflow, and commission configuration

**Workflow**:
1. Admin assigns accountants to specific properties or users
2. Accountant creates income transactions within their scope
3. Accountant groups transactions into payout batches (status: draft)
4. Admin reviews and approves/rejects batches (dual approval requirement)
5. Admin marks batches as paid when payment is completed
6. All status changes are audit-logged

**API Endpoints**:
- `/api/income/commission-configs` (Admin only): CRUD for commission configuration
- `/api/income/assignments` (Admin only): CRUD for accountant assignments
- `/api/income/my-assignments` (Accountant): View own active assignments
- `/api/income/batches` (Accountant/Admin): CRUD for payout batches with status workflow
- `/api/income/transactions` (Accountant/Admin): CRUD for income transactions with scope filtering
- `/api/income/reports` (Admin only): Aggregate reports by user/property/category/timeframe

**Features**:
- Sequential batch number generation per year (format: YYYY-NNNN)
- Accountant scope filtering ensures data isolation
- Comprehensive reporting with grouping by day/week/month/user/property/category
- Audit logging for all batch status changes and critical operations
- Zod schema validation on all mutations

### Key Features and Workflows

*   **Property Management**: Includes a property approval workflow, owner-submitted change requests, and owner settings for appointment auto-approval. All properties are standardized to Tulum location. Sublease functionality is supported with search filters.
*   **Property Submission**: A multi-step wizard with automatic draft saving, digital agreement signing using admin-managed templates, and audit logging. Integration with approved condominium listings.
*   **Condominium Workflow**: User-requested condominiums require admin approval. The system includes 396 pre-approved Tulum condominiums.
*   **Client Dashboard**: A comprehensive overview for clients with personalized welcome, quick stats (appointments, favorites, opportunities, viewed properties), quick actions, and conditional sections. Includes appointment management with Google Calendar integration.
*   **User Experience**: Features an Airbnb-style role switching, full i18n support with language persistence across authentication, a WebSocket-based real-time chat system with secure authentication, enhanced presentation cards, granular email notification preferences, and device-based profile picture uploads.
*   **Public Dashboard**: An Airbnb-inspired design adapting for authenticated vs. non-authenticated users, with dual pricing support (rental/sale), improved property listing displays, and advanced search filters (property type, colony, condominium name). Features promotional banners with relevant imagery for property owners, service providers, and affiliate/referral programs.
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