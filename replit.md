# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive SaaS platform for real estate property management, primarily focused on the Tulum, Quintana Roo market. It streamlines operations for various user roles (master, admin, seller, owner, client) through features like property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform aims to enhance user experience with a professional, data-dense dashboard, role-based access, Google Calendar integration, configurable business hours, concierge time-blocking, a service provider marketplace, property submission with digital agreement signing, and a full back office for offer management. The business vision is to dominate the real estate property management sector in Tulum.

## Recent Changes

*   **October 7, 2025**: Fixed OnboardingTour duplicate close button issue. Migrated owner referrals from legacy `/api/owner-referrals` to unified `/api/referrals/owners` endpoints with expanded admin_jr permissions for approve/reject actions. Email notifications preserved during migration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing and TanStack Query for server state management. UI components leverage Radix UI primitives and Shadcn/ui, styled with Tailwind CSS, and support light/dark themes and internationalization (Spanish/English). It features a professional design system and role-switching capabilities.

### Backend

The backend utilizes Node.js with Express.js and TypeScript (ESM modules), providing a RESTful API with role-based middleware and JSON-based error handling. It implements a dual authentication system: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage

The application uses PostgreSQL (Neon serverless) and Drizzle ORM for type-safe interactions. The schema supports user management, property statuses, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, and audit logs. A lead capture system tracks user actions and manages rental opportunity requests. A dedicated `condominiums` table manages approved condominium listings with a three-state approval workflow.

A comprehensive bidirectional review system enables feedback between users for properties, appointments, concierges, and clients.

A financial tracking and payout management system handles commissions, referrals, and rental income. This includes `rentalCommissionConfigs`, `accountantAssignments`, `payoutBatches`, and `incomeTransactions` tables, with a workflow for accountants to create transactions and batches, and admins to approve them. Access control is role-based, ensuring data isolation for accountants.

A comprehensive rental contract and commission management system tracks the complete rental lifecycle from reservation (apartado) to check-in and payment release. The `rentalContracts` table stores contract details, commission calculations, lifecycle timestamps, and digital signature tracking for owner and tenant terms. **Terms Acceptance Integration**: Owner terms acceptance from property submission wizard (`propertySubmissionDrafts.termsAcceptance`) automatically flows into rental contracts. When a draft is approved, it's linked to the created property via `propertyId`, and `termsAcceptance` is normalized with `acceptedAt` timestamp. During rental contract creation, `ownerTermsSignedAt` is auto-filled from the draft's acceptance data, streamlining the contract lifecycle and ensuring compliance tracking. 

Commission calculations are automated based on lease duration following the official rental terms:
- 5+ years = 3 months rent
- 4 years = 2.5 months rent
- 3 years = 2 months rent
- 2 years = 1.5 months rent
- 1 year = 1 month rent
- 6 months = 0.5 months rent
- < 6 months = Vacation mode (15% of total reservation)

Referral system: Properties track referral partners via `referralPartnerId` and customizable `referralPercent` (default 20%). Commission distribution: Without referral = 50/50 split (Seller 50%, HomesApp 50%). With referral (e.g. 20%) = Seller reduces 10%, HomesApp reduces 10%, creating: Seller 40%, Referral 20%, HomesApp 40%. 

Administrative fees: $2,500 MXN for personal use contracts or $3,800 MXN for sublease contracts. Seller income visibility: Shows when status >= apartado, but payment released only at check-in. Digital signatures required from both owner and tenant before contract progression.

### Key Features and Workflows

*   **Dual-Type Appointment Scheduling**: Supports two appointment modes:
    - **Individual**: 1-hour slots for single property visits (8 slots per day per concierge)
    - **Tour**: 30-minute slots per property, allowing clients to book tours of multiple properties (max 4) sequentially with a shared tourGroupId
    - **Business Hours Configuration**: Admin-configurable business hours (default: 10am-6pm Monday-Saturday)
    - **Concierge Time-Blocking**: Concierges can block personal time slots to manage availability, but cannot cancel confirmed appointments
*   **Property Management**: Includes a property approval workflow, owner-submitted change requests, owner settings for appointment auto-approval, and sublease functionality. All properties are standardized to Tulum location.
*   **Property Submission**: A streamlined 5-step wizard with automatic draft saving, digital agreement signing using admin-managed templates, and integration with approved condominium listings. The wizard consolidates: (1) Operation Type + Basic Info, (2) Location + Physical Details, (3) Multimedia, (4) Services & Utilities, (5) Terms + Final Review. Property upload is only accessible from within "Mis Propiedades" page, not from the sidebar. Colony and condominium selection uses a consistent Plus button pattern that opens suggestion dialogs for user-submitted entries requiring admin approval. The area (m²) field is optional - properties can be submitted without area information, which will be hidden in listings.
    - **Amenities System**: Categorized into property features (general amenities) and condominium amenities. Condo amenities are conditionally displayed based on property type - they're hidden for houses and land since these don't have shared condominium facilities. Badge-based toggle UI for amenity selection with admin suggestion editing capability.
    - **Services System (Step 4)**: Intelligent service configuration distinguishing between included and non-included utilities. Services marked as included (water, electricity, internet) require only a toggle. Services NOT included require provider name and estimated cost with validation. For electricity, CFE is set as default provider with billing cycle options (monthly/bimonthly, default: bimonthly). Additional services include predefined options (pool cleaning, garden maintenance, gas) plus custom services with user-defined names. Step 4 also captures accepted lease durations. Only included services are displayed on property cards to clients.
    - **Terms & Review (Step 5)**: Simplified final step with no redundant commercial fields. Features dual-tab interface: "Revisión Completa" displays comprehensive property summary (operation type, basic info, location, details, services, multimedia), while "Términos y Condiciones" presents 12-point rental agreement terms in a scrollable area. Requires three mandatory acceptances: (1) information accuracy confirmation, (2) commission scheme acceptance, (3) general terms acceptance. Acceptance data (with timestamp) is persisted to `propertySubmissionDrafts.termsAcceptance` before marking draft as submitted.
    - **Suggestion Limits**: Users are limited to 3 suggestions per day and 15 total suggestions (across colonies, condominiums, and amenities combined) to prevent spam and maintain data quality.
*   **Condominium & Colony Workflow**: User-requested condominiums and colonies require admin approval. The system includes 396 pre-approved Tulum condominiums. Both use a unified dialog-based suggestion pattern with SuggestCondoDialog and SuggestColonyDialog components.
*   **Client Dashboard**: Provides a comprehensive overview with personalized welcome, quick stats, quick actions, and appointment management with Google Calendar integration.
*   **User Experience**: Features an Airbnb-style role switching, full i18n support with language persistence, a WebSocket-based real-time chat system, enhanced presentation cards, granular email notification preferences, and device-based profile picture uploads. Simplified navigation with streamlined sidebar menu (reduced from 23+ to 15 essential items for cleaner UX). Theme toggle moved to profile settings for cleaner header design.
*   **Notification System**: Comprehensive dual-channel notification system with in-app notifications and email preferences. Users can configure 6 email categories (appointments, offers, messages, property updates, rental updates, marketing). Email delivery via dual provider setup (Resend primary, Gmail API backup). Implemented emails include: user verification, lead verification, duplicate lead alerts, owner referral verification, and commission approvals. In-app notifications feature unread badges, advanced filtering (text search, type, priority), priority-based badges (low/medium/high/urgent), SLA deadline tracking with visual indicators, automatic priority-based sorting, and click-through navigation to related entities. 
*   **My Properties Views**: Multiple view modes (grid, list, compact) for property browsing, allowing users to choose their preferred visualization style.
*   **Bank Information Management**: Comprehensive payment account setup supporting Mexican banks (with CLABE), Zelle, and Wise. Users can configure account holder name, account number, email, and address for receiving commissions and payments.
*   **Public Dashboard**: An Airbnb-inspired design adapting for authenticated vs. non-authenticated users, with dual pricing support (rental/sale), improved property listing displays, advanced search filters, and promotional banners.
*   **Virtual Assistant (MARCO)**: An intelligent, humanized chatbot powered by OpenAI GPT-5 that guides clients through property search, suggests presentation cards, and coordinates appointments. It's configurable by admins and internationalized.
*   **Referral System**: Secure, role-based referral filtering ensures users only see their own referrals, with admins having full visibility.
*   **Welcome Modals**: First-time welcome modals for clients and property owners to introduce features.
*   **Service Provider Messaging**: One-click chat initiation with service providers from their directory listings.
*   **Application System**: A unified application flow at `/aplicar` for users to apply as sellers (via role-requests) or service providers (via providerApplications), accessible from the landing page.
*   **Admin Panel Enhancements**: Includes full English translation, a dedicated admin profile management page with photo upload and password changes, a streamlined user menu, an integrations control center for monitoring external API connections (Google Calendar, OpenAI, Gemini, Resend, Gmail), and a comprehensive contract management system with lifecycle tracking, commission visualization, and timeline views.
*   **Role Request System**: Enhanced with mandatory email, WhatsApp, and structured years of experience fields for applications.

### System Design Choices

The platform uses unified middleware for consistent authentication handling, automatic logging for auditing, and a public dashboard that adapts its experience based on user authentication. WebSocket security for real-time chat implements session-based authentication, per-conversation authorization, and secure connection handling.

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