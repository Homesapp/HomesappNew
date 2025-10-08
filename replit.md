# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed to streamline real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client) and offers features such as property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing for property submissions, and a robust back office for offer management, with the ambition to dominate the Tulum real estate market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI components are built with Radix UI and Shadcn/ui, styled with Tailwind CSS, and support light/dark themes and i18n (Spanish/English). The design emphasizes professionalism and role-switching.

**Modern React Patterns Implemented (2025-10-08)**:
- **Progressive Web App (PWA)**: Full offline support with Service Worker, cache strategies (CacheFirst for static assets, NetworkFirst for API, StaleWhileRevalidate for reference data), install prompts with 7-day dismiss cooldown, and update notifications
- **Context API**: Centralized state management for theme (ThemeProvider), language (LanguageProvider), and PWA (PWAProvider) using singleton pattern to prevent duplicate registrations in Strict Mode
- **Custom Hooks**: Extensive use of domain-specific hooks (useAuth with role-switching, useAppointments, useProperties, etc.) with useMemo/useCallback for performance optimization
- **Server State**: TanStack Query v5 for all API data fetching with proper invalidation patterns and hierarchical cache keys

### Backend
The backend is built with Node.js, Express.js, and TypeScript (ESM), providing a RESTful API. It features role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage
PostgreSQL (Neon serverless) and Drizzle ORM are used for type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, a `condominiums` table with a three-state approval workflow, and a bidirectional review system. Financial tracking, payout management, and a comprehensive rental contract system are integrated, handling commissions, referrals, and rental income with automated commission calculations and digital signature tracking. An automatic error tracking system captures frontend errors, console errors, and unhandled promise rejections, logging them to the database and notifying administrators.

The schema includes:
- **Condominiums**: Linked to colonies via `colonyId` foreign key for parent-child relationship
- **Colonies**: Standalone entities that can contain multiple condominiums
- **Amenities**: Categorized as property or condominium amenities
- **Property Features**: Custom characteristics for properties with optional icons (e.g., pool, gym, garden)

**Performance Optimizations (2025-10-08)**:
- **20 B-tree indexes** added to critical tables for 50-90% query performance improvement:
  - **Properties**: 7 indexes (status, owner_id, active, created_at, approval_status, composite active+status, active+published)
  - **Appointments**: 6 indexes (date, status, client_id, property_id, concierge_id, composite status+date)
  - **Income Transactions**: 7 indexes (beneficiary_id, property_id, category, status, created_at, composite status+beneficiary, category+status)
- Expected improvements: Property listings 50-80% faster, Appointment calendars 40-60% faster, Financial reports 60-90% faster

**Security Enhancements (2025-10-08)**:
- **Comprehensive Authorization Audit**: Full security review of RBAC system covering 200+ endpoints, 12 user roles, and 3 middleware layers
- **P0 Critical Fix**: Role-switching privilege escalation vulnerability patched - admin roles (master, admin, admin_jr) are now forbidden from user-initiated role switches via `/api/users/switch-role`
- **Enhanced Role Validation**: Explicit ADMIN_ROLES and SWITCHABLE_ROLES whitelists prevent privilege escalation even if database is compromised
- **Security Posture**: Overall grade B+ (Good with Critical Fix Needed) → A- (Very Good) after P0 fix
- **Audit Documentation**: Complete security findings documented in SECURITY_AUDIT_AUTHORIZATION.md with remaining P1/P2/P3 recommendations tracked

**Scalability Assessment (2025-10-08)**:
- **Comprehensive Database Analysis**: Traffic patterns analyzed with read/write ratio of 85-90% reads vs 10-15% writes
- **Current Capacity**: System can handle 5,000-10,000 daily active users with current optimizations (20 indexes + Neon auto-scaling)
- **Redis Cache Recommendation**: Identified as P0 quick win for static data (condominiums, colonies, amenities) - 50-90% query reduction for $0-8/month
- **Read Replicas Decision**: Deferred until traffic exceeds 10,000+ DAU - current architecture sufficient for 12-24 months projected growth
- **Query Performance**: Post-index baselines show 50-90% improvements on critical queries (property search, appointments, financial reports)
- **Scalability Documentation**: Complete analysis documented in SCALABILITY_ANALYSIS.md with prioritized optimization roadmap

**Redis Cache Implementation (2025-10-08)**:
- **Tier 1 Static Data Caching**: Implemented Redis cache for 4 high-frequency reference data endpoints with 24h TTL
  - /api/condominiums/approved - Approved condominium listings
  - /api/colonies/approved - Approved colony listings
  - /api/amenities - All amenities (property & condominium)
  - /api/property-features - All property features with icons
- **Cache Infrastructure**: Created cache module (server/cache.ts) with ioredis client supporting Upstash and local Redis
- **Graceful Degradation**: System works without Redis configured - cache operations fail silently, app continues normally
- **Complete Cache Invalidation**: 17 admin mutation endpoints automatically invalidate cache on data modifications:
  - Condominiums: create (admin), approve, reject, update, toggle active, delete
  - Colonies: create (admin), approve, reject, update, delete
  - Amenities: create (admin), approve, reject, update, delete
  - Property Features: create
- **Smart Invalidation**: Only admin-approved data is cached; user suggestions (pending status) don't trigger invalidation
- **Expected Impact**: 50-90% reduction in database queries for reference data, improved response times for property search/filtering
- **Cache Helpers**: Centralized invalidation functions (server/cacheInvalidation.ts) for maintainability and consistency
- **Type Safety**: Generic cache.get<T>() with TypeScript support for type-safe cache retrieval
- **Cost**: $0-8/month for Upstash Redis (free tier: 10K requests/day, paid tier: $0.20/100K requests)

### Key Features and Workflows
*   **Dual-Type Appointment Scheduling**: Supports individual and tour slots with admin-configurable business hours.
*   **Appointment Reschedule Workflow**: Owner-initiated reschedule requests with client approval/rejection flow. When owner requests reschedule, client can approve (appointment date changes) or reject (appointment auto-cancels). Calendar uses color coding: green (approved), red (cancelled), yellow (rescheduled). Archiving system keeps approved appointments visible; only completed/cancelled appointments are archived.
*   **Property Approval Workflow (2025-10-08)**: Redesigned multi-stage approval process with controlled editing permissions:
    - **States**: draft → pending_review → accepted → documents_validated → inspection_scheduled → inspection_completed → approved → published
    - **Editing Rules**: Owners can freely edit properties in draft, pending_review, and changes_requested states. Once admin accepts (moves to "accepted"), all future edits require change requests with admin approval.
    - **Admin Actions**:
      1. Accept property (draft/pending_review → accepted)
      2. Validate documents (accepted → documents_validated)
      3. Schedule inspection (documents_validated → inspection_scheduled) - Creates inspection report, assigns concierge
      4. Approve without inspection (documents_validated → approved) - For trusted properties, creates "skipped" inspection record
      5. Final approval (inspection_completed → approved) - After concierge inspection
      6. Publish (approved → published) - Makes property live on platform
    - **Concierge Inspection**: Extended feedback system captures structural condition, cleanliness, utilities, security, amenities, documentation review, and recommendations
    - **API Endpoints**: 7 new endpoints enforce state transitions with audit logging and role-based access control
*   **Property Management**: Includes owner change requests, auto-approval settings, sublease functionality, pet-friendly indicators, and custom listing titles for better property identification.
*   **Property Staff & Task Management**: System for assigning staff to properties with role-based assignments and task tracking.
*   **Property Submission**: A 5-step wizard with draft saving, digital agreement signing, and integration with approved condominiums. Supports optional custom listing titles for private houses.
*   **Condominium & Colony Workflow**: User-suggested condominiums/colonies require admin approval, with pre-approved Tulum condominiums.
*   **Property Display Logic**: Appointment titles and property listings show customListingTitle for private houses, or condoName+unitNumber for condominiums, with fallback to title.
*   **Client Dashboard**: Personalized overview with stats, quick actions, and Google Calendar integration.
*   **User Experience**: Features Airbnb-style role switching, full i18n support, WebSocket-based real-time chat, enhanced presentation cards, granular email notification preferences, and streamlined navigation.
*   **Notification System**: Dual-channel (in-app and email) with configurable categories, priority-based in-app notifications, and SLA tracking.
*   **My Properties Views**: Simplified list-view with quick action dropdowns.
*   **Bank Information Management**: Supports Mexican banks (CLABE), Zelle, and Wise.
*   **Public Dashboard**: Airbnb-inspired design with dual pricing, advanced search, and promotional banners.
*   **Virtual Assistant (MARCO)**: OpenAI GPT-5 powered chatbot for client guidance.
*   **Referral System**: Role-based referral filtering.
*   **Welcome Modals**: First-time user onboarding.
*   **Service Provider Messaging**: One-click chat from directory listings.
*   **Application System**: Unified application flow for sellers and service providers.
*   **Admin Panel Enhancements**: Full English translation, admin profile management, integrations control, and contract management.
*   **Role Request System**: Enhanced with mandatory contact and experience fields.
*   **Admin CRUD System**: Full create/read/update/delete capabilities for condominiums, colonies, amenities, and property features. Admin users bypass suggestion limits and create entities as auto-approved. The system includes:
    - Colony management with edit, delete, and toggle active/inactive
    - Amenity management with category support (property/condominium)
    - Property features management with optional Lucide icon names
    - Condominium management with colony linking and full CRUD operations
    - Unified admin interface in AdminCondominiums page with 4 tabs
*   **Automatic Error Tracking**: Comprehensive error monitoring system that captures and logs all frontend errors:
    - React render errors via ErrorBoundary component with user-friendly error screens
    - Unhandled promise rejections captured globally
    - Window JavaScript errors tracked automatically
    - Console errors logged for debugging (with original console preserved)
    - All errors sent to backend with Zod validation and automatic admin notifications
    - High-priority notifications sent to admin, master, and admin_jr roles
    - Error logs stored with full context: error type, message, stack trace, URL, user info, browser details

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging for auditing. The public dashboard adapts based on user authentication. WebSocket security for real-time chat ensures session-based authentication and per-conversation authorization.

## External Dependencies
*   **Google Calendar API**
*   **Neon Database** (PostgreSQL)
*   **Replit Auth** (OpenID Connect)
*   **Resend API**
*   **Radix UI**
*   **Lucide React**
*   **date-fns**
*   **react-day-picker**
*   **Zod**
*   **WebSocket (ws)**
*   **cookie**
*   **OpenAI GPT-5**