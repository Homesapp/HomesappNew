# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for intelligent real estate property management in Tulum, Quintana Roo. It streamlines property management tasks including scheduling, client interactions, service coordination, and offer processing. Key features include role-based access, Google Calendar integration, a service provider marketplace, and digital agreement management. The platform aims to lead the Tulum market through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## Recent Changes
**November 24, 2025**: Collapsible Public Registration Links
- Made "Links de Registro Público" section collapsible in ExternalClients page
- Section now starts collapsed by default to reduce visual clutter
- Added expand/collapse button with ChevronDown/ChevronUp icons
- Implemented using Shadcn Collapsible component for smooth animations

**November 24, 2025**: Quotations Dual Description Feature
- Added `solutionDescription` field to external_quotations schema for comprehensive work documentation
- Implemented side-by-side "Descripción del Trabajo" and "Descripción de la Solución" in quotation form
- Updated form validation schema to include solutionDescription
- Enhanced handleEdit function to properly load solutionDescription when editing existing quotations
- Database column added via SQL: `solution_description TEXT` in external_quotations table

**November 24, 2025**: Professional Quotation Form Redesign
- Completely redesigned quotation creation form with modern, professional UI
- Organized form into clear visual sections with icons and better spacing
- Improved service management with numbered cards, better layout, and inline subtotals
- Enhanced financial summary with highlighted totals and better visual hierarchy
- Added visual indicators (badges, borders) for better UX
- Increased dialog width (max-w-5xl) for better content visibility
- Improved field placeholders and labels for clearer guidance
- Better grouping of related fields with background sections
- Larger buttons and better action button placement

**November 24, 2025**: Fixed Quotations Form SelectItem Error and Unit/Client Display
- Resolved "select_item must have a value prop that is not an empty string" error when creating new quotations
- Removed invalid SelectItem components with empty string values for "Ninguno/Ninguna" options
- Modified clientId and unitId Select components to use undefined for optional values instead of empty strings
- Changed quotations form to use "Unidades" instead of "Propiedades" for external agencies (external_units table)
- Fixed client display to show firstName + lastName instead of non-existent name field
- Fixed units query to use /api/external-units endpoint instead of /api/external-properties
- Unit dropdown now displays unit number and condominium name when available

**November 24, 2025**: Tenant/Guarantor Document Upload System Implemented
- Added comprehensive document upload functionality to rental application forms
- Supports 6 document types: tenant ID, proof of address, proof of income + guarantor ID, proof of address, proof of income
- Backend: Created multer-based upload endpoint at `/api/rental-form-tokens/:token/upload-documents` with file validation (jpg/png/pdf/webp, 10MB limit)
- Frontend: Enhanced step 8 of PublicRentalForm.tsx with complete upload UI including file selection, progress states, success indicators, and removal capability
- Database: Modified tenant_rental_forms schema to make property_id nullable and added external_unit_id for external system support
- Fixed critical bug: Form submission now correctly extracts and persists document URLs from frontend payload into database
- Files stored in attached_assets/tenant_documents/ directory with token-based organization

**November 24, 2025**: Maintenance Module UI/UX Improvements
- Reorganized ExternalMaintenance.tsx layout: moved "Nuevo Ticket" button to header alongside title for better accessibility
- Removed mobile-only restriction for view mode toggles - cards/table toggle now available on all devices
- Enhanced ExternalQuotationsTab.tsx with consistent UI: search bar, filters in Popover, view mode toggle (cards/table)
- Fixed critical bug: ExternalQuotationsTab now correctly passes agencyId query parameter when fetching properties
- Implemented dual-view support for quotations: table view for detailed data, card view for visual overview
- Ensured consistent layout and functionality across Tickets and Quotations tabs

**November 24, 2025**: Fixed Critical Token Validation Bug
- Resolved "Cannot convert undefined or null to object" error in token validation endpoints
- Refactored `getRentalFormTokenDataLean` and `getOfferTokenDataLean` in server/storage.ts
- Replaced complex Drizzle ORM leftJoin queries with separate parallel queries to avoid null mapping issues
- Added validation to treat tokens as invalid if required external unit relationship is missing
- Both rental form tokens (/api/rental-form-tokens/:token/validate) and offer tokens (/api/offer-tokens/:token/validate) now work correctly

**November 24, 2025**: Integrated Quotations System into Maintenance Module
- Converted ExternalQuotations from standalone page to tab-based component (ExternalQuotationsTab.tsx)
- Implemented Shadcn Tabs UI in ExternalMaintenance.tsx with two tabs: "Tickets" and "Cotizaciones"
- Removed standalone /external/quotations route and sidebar navigation entry
- Quotations now accessible exclusively through Maintenance section tab navigation
- Maintains full CRUD functionality, PDF generation, and public sharing capabilities

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp utilizes a modern web stack designed for a professional, responsive, accessible, and internationalized user experience.

The frontend is built with React 18, TypeScript, Vite, Wouter, and TanStack Query. UI components from Radix UI and Shadcn/ui are styled with Tailwind CSS for responsive, mobile-first design, including light/dark theme support. Form management uses Shadcn Form, `useForm`, and Zod for validation.

The backend, developed with Node.js, Express.js, and TypeScript, provides a RESTful API. It features role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and integrated OpenAI services. Contract routes incorporate Zod validation, data sanitization, and role-based authorization.

Data is stored in PostgreSQL (Neon serverless) and accessed via Drizzle ORM for type-safe operations. The schema supports extensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Core architectural features include unified middleware, content adaptation, and real-time chat via WebSockets. The platform offers advanced functionalities such as role-based access control, a sophisticated appointment system, comprehensive property and rental lifecycle management with an offer system, automated contract generation, an HOA module, and a robust notification system. AI capabilities include predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant powered by OpenAI GPT-4. The system also integrates a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, comprehensive financial accounting, and automated rent collection with payment reminders.

The system implements extensive pagination and sortable columns with consistent page reset logic. Mobile responsiveness includes SSR-safe auto-switching between card and table views, with a manual override. Unified filter UX is managed through Popover modals, and performance is optimized using TanStack Query caching and React memoization. Enterprise-grade security includes data encryption (AES-256-GCM), enhanced audit logging, rate limiting, and strict multi-tenant isolation. Performance for external endpoints is optimized with PostgreSQL trigram indexes and lean DTOs, reducing lookup latency and response payloads. The External Management System includes a comprehensive Kanban board for lead management with drag-and-drop functionality, three distinct views (table, cards, Kanban), and localized status labels. Duplicate detection for clients and leads is implemented using normalized name comparison and phone number matching. Public lead registration is facilitated through permanent URLs for seller and broker registrations. The system supports drag-and-drop sidebar reordering with user role-specific persistence. Contract sections utilize unified token tables for internal and external systems, ensuring multi-tenant isolation, link generation for rental offers and tenant applications, and real-time status updates via intelligent polling. The External Management System now includes a professional quotation system with service line items, automatic 15% administrative fee calculation, PDF generation, shareable public links via tokens, and conversion to maintenance tickets with service snapshot preservation.

## External Dependencies
*   Google Calendar API
*   Google OAuth 2.0
*   Neon Database (PostgreSQL)
*   Replit Auth (OpenID Connect)
*   Radix UI
*   Lucide React
*   date-fns
*   react-day-picker
*   Zod
*   WebSocket (ws)
*   OpenAI GPT-5
*   express-rate-limit