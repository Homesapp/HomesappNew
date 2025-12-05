# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for intelligent real estate property management in Tulum, Quintana Roo. It streamlines property management tasks, including scheduling, client interactions, service coordination, and offer processing. The platform features role-based access, Google Calendar integration, a service provider marketplace, and digital agreement management. Its vision is to lead the Tulum market by enhancing real estate operations and client engagement through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built with a modern web stack emphasizing responsiveness, accessibility, and internationalization.

The frontend utilizes React 18, TypeScript, Vite, Wouter, and TanStack Query, with UI components from Radix UI and Shadcn/ui styled using Tailwind CSS for responsive design and theme support. Forms are managed with Shadcn Form, `useForm`, and Zod validation.

The backend, developed with Node.js, Express.js, and TypeScript, provides a RESTful API. It includes role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and integrated OpenAI services. Contract routes incorporate Zod validation, data sanitization, and role-based authorization.

Data is persisted in PostgreSQL (Neon serverless) and accessed via Drizzle ORM, supporting comprehensive management of users, properties, appointments, clients, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Core architectural features include unified middleware, content adaptation, real-time chat via WebSockets, and advanced functionalities like role-based access control, a sophisticated appointment system, property and rental lifecycle management with an offer system, automated contract generation, an HOA module, and a robust notification system. AI capabilities encompass predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant. The system integrates a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, comprehensive financial accounting, and automated rent collection with payment reminders.

The system incorporates extensive pagination, sortable columns, consistent page reset logic, and mobile responsiveness with SSR-safe auto-switching between card and table views. Unified filter UX is managed through Popover modals, and performance is optimized using TanStack Query caching and React memoization. Enterprise-grade security features include data encryption (AES-256-GCM), enhanced audit logging, rate limiting, and strict multi-tenant isolation. External endpoint performance is optimized with PostgreSQL trigram indexes and lean DTOs. The External Management System includes a Kanban board for lead management with drag-and-drop functionality, multiple views (table, cards, Kanban), and localized status labels. Duplicate detection for clients and leads uses normalized name comparison and phone number matching. Public lead registration is facilitated via permanent URLs. Drag-and-drop sidebar reordering with user role-specific persistence is supported. Contract sections utilize unified token tables for internal and external systems, ensuring multi-tenant isolation, link generation for rental offers and tenant applications, and real-time status updates via intelligent polling. A professional quotation system with service line items, automatic administrative fee calculation, PDF generation, shareable public links, and conversion to maintenance tickets is also included. The system offers 3 selectable PDF design templates (Professional, Modern, Elegant) for rental and owner forms, with dual branding.

The CRM functionality within the External Management System now includes lead and client activity tracking (calls, emails, meetings, WhatsApp, showings), lead status history, property showing scheduling, client activity timelines, client property history, client blacklist management, lead-to-client conversion, improved duplicate detection, and a reminder system for leads.

A dedicated notification system for agencies is integrated within the External Management System, offering agency-specific notifications, API endpoints for external notifications, real-time polling, and priority-based visual indicators.

The system provides dedicated portal access for tenants and owners, featuring token-based authentication, contract-scoped permissions, payment tracking, maintenance reporting, document viewing, and AI chat support.

An internal listing verification system ensures QA control with three statuses (unverified, pending_review, verified), visual badges, and verification notes. Publication controls allow for unpublishing listings.

An owner intake link system generates private links for property owners to submit property information.

Unit pricing supports dual pricing for rent and sale, with configurable listing types and currency defaults.

A referral system for property referrals (exclusive to Tulum Rental Homes) manages commission types and referrer information, including a dedicated referral network page.

SEO-friendly URLs are implemented for offer and rental form links, with public resolver endpoints and auto-generated slugs for units and agencies.

A comprehensive team chat system for sellers and admins includes real-time messaging, file/image/audio support, activity notifications, a points and gamification system with leaderboards, and seller profile metrics.

Automated email lead import from external real estate platforms (Tokko Broker, EasyBroker) is supported via Gmail API integration, scheduled polling, provider-specific parsing strategies, duplicate detection, and message ID tracking.

A photo editing system for property images includes canvas-based adjustments (brightness, contrast, etc.), preset real estate filters, and a watermark/logo overlay system with agency-level configuration. It also features a BulkPhotoEditor component and export functionality.

Reusable searchable dropdown components (`SearchableSelect`, `SearchableMultiSelect`) are implemented for improved UX in forms, supporting bilingual placeholders and messages.

A deterministic public chatbot (FloatingChat) for lead capture uses a state machine architecture instead of LLM to guarantee data collection. Features include mandatory step-by-step data collection (operation type, name, phone, budget, zone, move date, bedrooms), quick reply buttons for common options, phone validation with retry logic (max 2 attempts), normalized phone storage for duplicate detection, bilingual support (Spanish), property/source context awareness (homepage vs property page), and optional appointment scheduling after lead capture with date/time selection.

## Dual-Brand Architecture (TRH & Homesapp)
The platform supports a dual-brand architecture:
- **TRH (Tulum Rental Homes)**: Focused on rental operations (long-term and short-term rentals)
- **Homesapp**: Focused on property sales operations

Properties can have multiple listings with different brands. The `listingType` field supports: `rent_long`, `rent_short`, and `sale`. The `brand` field identifies which brand manages the listing (`TRH` or `HOMESAPP`).

### Sales Module (Homesapp)
A complete sales workflow for property sales including:
- **Sale Offers**: Full lifecycle management (draft → pending → under_review → counter_offer → accepted/rejected/expired/withdrawn) with Zod validation and strict RBAC
- **Sale Contracts**: Complete contract workflow (draft → pending_signature → active → in_escrow → pending_closing → closed/cancelled) with event tracking, payment recording, and document management
- **Sales Agent Dashboard**: Pipeline visualization for offers and contracts, commission tracking, quick actions for valuations/buyers/properties, and full i18n support (Spanish/English)
- **Role-Based Access**: `sales_agent` role with strict per-resource ownership enforcement; agents can only access their own offers and contracts
- **API Routes**: Complete REST API with Zod validation, ownership checks, and audit logging
- **Valuations (CMA Tool)**: Comparative Market Analysis system with property data, comparable properties, adjustments, and price range generation (draft → pending_review → completed → expired workflow)
- **Valuation Requests**: Owner portal integration allowing property owners to request valuations; agents can be assigned and complete requests
- **My Buyers Page**: Kanban and list views for managing buyer leads with status pipeline (new → contacted → qualified → showing → negotiating → closed/lost)
- **My Properties Page**: Grid and list views for sales properties with filtering and quick valuation creation

Database tables for sales module:
- `sale_offers`: Purchase offers with buyer leads, pricing, conditions, and financing details
- `sale_contracts`: Compraventa contracts with buyer/seller information, escrow tracking, and document management
- `sale_contract_events`: Timeline events for contract status changes and milestones
- `valuations`: Property valuations with CMA methodology, price ranges, and comparable analysis
- `valuation_comparables`: Comparable properties linked to valuations with adjustments and pricing
- `valuation_requests`: Owner-initiated valuation requests with agent assignment workflow

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