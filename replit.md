# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for intelligent real estate property management in Tulum, Quintana Roo. Its purpose is to streamline property management, including scheduling, client interactions, service coordination, and offer processing. Key capabilities include role-based access, Google Calendar integration, a service provider marketplace, and digital agreements. The platform aims to lead the Tulum market by leveraging advanced commission systems, marketing automation, predictive analytics, and AI.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built on a modern web stack, emphasizing a professional, responsive, accessible, and internationalized user experience.

The frontend uses React 18, TypeScript, Vite, Wouter, and TanStack Query, with UI components from Radix UI and Shadcn/ui, styled using Tailwind CSS for responsive, mobile-first design with light/dark themes. Form handling involves Shadcn Form, `useForm`, and Zod for validation.

The backend is developed with Node.js, Express.js, and TypeScript, providing a RESTful API. It features role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and centralized OpenAI service integration. Contract routes enforce Zod validation, data sanitization, and role-based authorization.

Data is stored in PostgreSQL (Neon serverless) and accessed via Drizzle ORM for type-safe interactions. The schema supports comprehensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Key architectural features include unified middleware for authentication and logging, content adaptation for public dashboards, and real-time chat via WebSockets. The platform includes advanced features such as role-based access control, a sophisticated appointment system, full property management lifecycle support, comprehensive rental management with an offer system, automated contract elaboration, an HOA module for condominium management, and a robust notification system. AI capabilities include predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant powered by OpenAI GPT-4. The system also features a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed maintenance worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, and comprehensive financial accounting.

The Active Rentals section features comprehensive tabular data management with pagination (5/10/20/30 items per page) and sortable columns for both payment history (by service type: rent, electricity, water, internet, gas) and maintenance requests (sortable by title, urgency, status, created date). All tables implement synchronous page reset on filter changes and automatic page clamping when data changes.

The External Property Management System features comprehensive pagination across all sections. Card views implement configurable items per page: Condominiums offers 3/6/9 card selector (1-3 rows, 3-column grid, default 9), Owners defaults to 9 cards (3×3 grid), Rentals offers 3/6/9 card selector (1-3 rows, 3-column grid, default 9), and Accesses offers 4/8/12 card selector (1-3 rows, 4-column grid). Within each Condominium card, units are displayed using vertical navigation showing 2 units at a time, sorted with available units first then rented units, with up/down navigation buttons and consistent heights for uniform design. The Accesses section supports dual view modes: table view with 5-10-20-30 items per page (default: 5) and sortable columns (condominium, unit, type, code, description), and card view with 4 cards per row in desktop layout and configurable 1-2-3 rows per page (4-8-12 cards). All views implement a dual-layer pagination clamping pattern using useLayoutEffect for pre-render clamping and useEffect for data-change clamping, ensuring stable page indices during filter changes and data updates. Pagination controls are bilingual (Spanish/English) with Primera/First, Anterior/Previous, Siguiente/Next, and Última/Last navigation buttons. Synchronous page resets occur on all filter changes. Filters are collapsed by default to provide a cleaner initial view. All table views default to 5 items per page across External sections (Accesses, Maintenance, Accounting) and Active Rentals (payment history, maintenance requests, rentals table).

The User Accounts (Cuentas de Usuario) section includes full pagination (5/10/20/30 items per page, default 5) and column sorting capabilities. Sortable columns include Name, Email, Role, and Status. Both table and card view modes support pagination with bilingual controls (Primera/First, Anterior/Previous, Siguiente/Next, Última/Last). The system implements dual-layer pagination clamping to ensure stable page indices and proper page bounds. All filter changes are replaced with button toggles across all External sections (Accesses, Rentals, Maintenance, Accounting) for improved UX consistency.

The Accounting (Contabilidad Financiera) section includes a prominent "Today" (Hoy) filter button positioned next to the filters icon in the header, allowing users to quickly view all transactions scheduled for the current day. This same filter is also available within the date range filter section for easy access from the expanded filters panel.

All External sections (Accounting, Accesses, Condominiums, Maintenance) implement a unified filter UX using Popover modals. Each section features search fields always visible in the header (when applicable) for immediate access, with a compact filter icon button that opens a dropdown Popover (width: 24rem, max-height: 600px with scroll, right-aligned) containing categorical filter options with toggle buttons. Search inputs are placed before filter buttons in the toolbar for optimal workflow. This design provides a cleaner, more space-efficient interface while maintaining full filtering and search capabilities. Each Popover includes a "Clear Filters" button at the bottom for easy reset.

The maintenance system includes an enhanced tracking architecture with update timelines, photo documentation categorized by phase, scheduled maintenance windows, role-based closure permissions, completion notes, and multi-tenant security with agency ownership verification.

Security features include enterprise-grade measures compliant with 2025 standards for multi-tenant SaaS platforms: Data Encryption at Rest using AES-256-GCM with per-record random IVs, an encryption module for secure key derivation and constant-time comparison, enhanced audit logging for all sensitive operations, comprehensive rate limiting on critical endpoints, and strict multi-tenant isolation with agency ownership verification. The platform also supports GDPR/PCI-DSS compliance.

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
*   express-rate-limit