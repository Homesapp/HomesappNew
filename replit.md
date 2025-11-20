# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform designed for intelligent real estate property management in Tulum, Quintana Roo. Its core purpose is to streamline property management, including scheduling, client interactions, service coordination, and offer processing. Key capabilities include role-based access, Google Calendar integration, a service provider marketplace, digital agreements, and a robust back office. The platform aims to lead the Tulum market by leveraging advanced commission systems, marketing automation, predictive analytics, and AI.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built on a modern web stack, emphasizing a professional, responsive, accessible, and internationalized user experience.

The frontend uses React 18, TypeScript, Vite, Wouter, and TanStack Query, with UI components from Radix UI and Shadcn/ui, styled using Tailwind CSS for responsive, mobile-first design with light/dark themes. Form handling involves Shadcn Form, `useForm`, and Zod for validation.

The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It features role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and centralized OpenAI service integration. Contract routes enforce Zod validation, data sanitization, and role-based authorization.

Data is stored in PostgreSQL (Neon serverless) and accessed via Drizzle ORM for type-safe interactions. The schema supports comprehensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Key architectural features include unified middleware for authentication and logging, content adaptation for public dashboards, and real-time chat via WebSockets with session-based authentication. The platform includes advanced features such as role-based access control, a sophisticated appointment system, full property management lifecycle support (submission to digital agreement), comprehensive rental management with an offer system, automated contract elaboration, an HOA module for condominium management, and a robust notification system. AI capabilities include predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant powered by OpenAI GPT-4. The system also features a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed maintenance worker and owner management, an external calendar system (payments, tickets, rental contracts), rental purpose classification, Google Calendar sync, temporary credential management, unit information sharing, and comprehensive financial accounting with a unified ledger and advanced filtering.

The maintenance system includes an enhanced tracking architecture with update timelines, photo documentation categorized by phase (before/during/after), scheduled maintenance windows, role-based closure permissions (admin and maintenance managers only), completion notes, and multi-tenant security with agency ownership verification on all CRUD operations for maintenance updates and photos.

## Security Features

The platform implements enterprise-grade security measures compliant with 2025 standards for multi-tenant SaaS platforms:

**Data Encryption at Rest**: Sensitive data is encrypted using AES-256-GCM authenticated encryption with per-record random IVs and versioned prefix system (ENC:v1:). Encrypted fields include:
- External unit access codes (door codes, WiFi passwords, gate codes)
- Bank account numbers and CLABE interbancaria numbers

**Encryption Module** (`server/encryption.ts`): Provides encrypt/decrypt functions with authenticated encryption, secure key derivation via scrypt, and constant-time comparison utilities. The implementation features:
- Prefix-based detection (ENC:v1:) for reliable encryption identification
- Idempotent encrypt() function (safe to call multiple times)
- Backward compatible decrypt() (handles legacy plaintext data)
- Keys managed via environment variables (ENCRYPTION_KEY) with development fallback
- Data migration scripts with timestamp preservation

**Enhanced Audit Logging**: All sensitive operations are logged with comprehensive metadata including IP addresses, user agents, and contextual details. The createAuditLog helper function supports flexible metadata enrichment while preventing sensitive data leakage.

**Rate Limiting**: Comprehensive rate limiting protects critical endpoints including authentication, registration, email verification, chatbot interactions, and property submissions using express-rate-limit middleware.

**Multi-tenant Isolation**: All external property management operations enforce strict agency ownership verification to prevent cross-tenant data access. The verifyExternalAgencyOwnership middleware ensures secure data isolation.

**GDPR/PCI-DSS Compliance**: Encryption of personal and financial data, comprehensive audit trails, and secure session management support regulatory compliance requirements.

## Recent Changes

**2025-01-20**: Implemented unified atomic condominium and unit creation flow:
- **Unified Creation Button**: Replaced separate "Agregar Condominio" and "Agregar Unidad" buttons with single "Agregar" button that opens a dialog with type selection
- **Multi-unit Creation**: Enabled adding multiple units to a condominium in a single workflow using a "+" button to add additional unit forms
- **Atomic Transactions**: Implemented storage layer method `createCondominiumWithUnits` with db.transaction ensuring condominium and all units are created together or rolled back completely
- **Type Coercion Helpers**: Created `optionalNumber` and `optionalString` helpers in shared/schema.ts to convert empty strings to undefined and coerce numeric strings before validation
- **Client-side Validation**: Added externalUnitFormSchema.parse() in handleUnifiedSubmit to convert form strings to proper types before submission
- **Backend Endpoint**: New POST /api/external-condominiums/with-units endpoint that delegates to storage layer with proper audit logging
- **Improved UX**: Streamlined workflow eliminates need to create condominium first, then add units one-by-one
- Files: shared/schema.ts, server/storage.ts, server/routes.ts, client/src/pages/ExternalCondominiums.tsx
- Architect-reviewed and approved for production readiness

**2025-01-20**: Fixed data normalization and event display in ExternalDashboard and ExternalCalendar:
- **Consistent contract normalization**: Updated normalization to preserve unit and condominium metadata from API responses, handling both nested `{ contract, unit, condominium }` and flat contract structures with fallback lookups
- **Fixed event displays**: Corrected all contract property accesses to use `item.contract.property` pattern consistently throughout both pages
- **Enhanced payment events**: Added tenant names to payment event subtitles using format "Condominium - Unit (Tenant Name)" for better context
- **Improved event formatting**: Standardized location display to "Condominium - Unit" order across all event types (payments, tickets, contracts)
- **Fixed statistics**: Separated event counting by type to avoid mixing different data structures, ensuring accurate monthly event totals
- **Better icon alignment**: Changed from `items-start` to `items-center` for proper vertical alignment in upcoming events list
- **Corrected navigation**: Updated owner portfolio link to point to `/external/owners/portfolio` consolidated view
- Files: client/src/pages/ExternalDashboard.tsx, client/src/pages/ExternalCalendar.tsx
- Architect-reviewed and approved for production readiness

**2025-01-20**: UI/UX improvements in ExternalCondominiums page:
- **Fixed active rental counter**: Normalized nested contract structure `{ contract: ... }` to correctly count active rentals in both condominiums list and units list
- **Improved header layout**: Moved "Agregar Condominio" and "Agregar Unidad" buttons to headers alongside titles for cleaner, more compact design
- **Collapsible filters**: Added collapsible filter section in Units tab with ChevronDown/ChevronUp icons and filtersExpanded state to reduce visual clutter
- **Data normalization pattern**: Implemented `const normalizedContracts = (contracts ?? []).map(c => 'contract' in c ? c.contract : c)` to handle both nested and flat rental contract payloads
- Files: client/src/pages/ExternalCondominiums.tsx

**2025-01-20**: Professional redesign of External Management maintenance and owner portfolio sections:
- **Maintenance List (ExternalMaintenance.tsx)**: Complete redesign with professional table view, 6 key metrics (total/open/in-progress/resolved/estimated cost/actual cost), advanced filters (search, status, priority, category, condominium), improved create dialog with cascading unit selection
- **Maintenance Detail (ExternalMaintenanceDetail.tsx)**: Three-column layout, professional timeline with infinite scroll and color-coded update types, photo organization by phase (before/during/after/other) with visual badges, cost editing dialogs, comprehensive update system with type selection and status changes
- **Owner Portfolio (ExternalOwnerPortfolio.tsx)**: New consolidated dashboard aggregating units by owner (name+email), 6 global metrics (owners/units/income/expenses/balance/occupancy), sortable table with financial data, detail modal showing all owner units with contract status, CSV export functionality
- **Navigation**: Updated AppSidebar to point to improved portfolio view at /external/owners/portfolio
- Files: client/src/pages/ExternalMaintenance.tsx, ExternalMaintenanceDetail.tsx, ExternalOwnerPortfolio.tsx, client/src/App.tsx, client/src/components/AppSidebar.tsx

**2025-01-20**: Completed External Management UI/UX improvements:
- **Enhanced Dashboard**: Added monthly KPI cards (income, expenses, balance) with real-time calculations from financial transactions
- **Improved Calendar**: Enhanced event cards with color-coded backgrounds (green=payments, blue=tickets, purple=contracts) for better visual distinction
- **Rental Creation Wizard**: New 4-step wizard (Unit → Tenant → Terms → Confirm) replacing fragmented multi-page flow. Backend supports atomic contract + payment schedules creation in single transaction.
- **Checkout Report Templates**: Added "Use Template" buttons for inventory and cleaning with non-destructive merge (preserves existing data)
- **Backend**: Extended POST /api/external-rental-contracts with createRentalContractWithServicesSchema to accept additional services and create all payment schedules atomically
- Files: client/src/pages/ExternalDashboard.tsx, ExternalCalendar.tsx, ExternalCheckoutReport.tsx, client/src/components/RentalWizard.tsx, server/routes.ts, shared/schema.ts

**2025-01-20**: Implemented critical workflow automations:
- **Maintenance-Financial Integration**: Tickets with actualCost now auto-generate financial transactions
- **Notifications System**: New externalNotifications table for automated alerts (payments, tickets, contracts)
- **Automatic Payment Generation**: Script to generate recurring payments from schedules monthly
- See WORKFLOW_IMPROVEMENTS.md for detailed documentation

**2025-01-20**: Completed Priority 1 security implementation including:
- AES-256-GCM encryption for sensitive data with ENC:v1: prefix system
- Idempotent encryption operations (safe for already-encrypted data)
- Backward compatible decryption (handles legacy plaintext)
- Automatic encryption/decryption in access control and bank info routes
- Enhanced audit logging with IP address and User-Agent tracking
- Migration scripts with proper prefix detection and timestamp preservation
- Comprehensive documentation (SECURITY_IMPROVEMENTS.md, SECURITY_TESTING_GUIDE.md)
- Architect-reviewed and approved for production readiness

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
*   express-rate-limit (Security)