# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform designed for intelligent real estate property management in Tulum, Quintana Roo. It aims to streamline property management tasks such as scheduling, client interactions, service coordination, and offer processing. The platform features role-based access, Google Calendar integration, a service provider marketplace, and digital agreement management. Its goal is to become a leader in the Tulum market by leveraging advanced commission systems, marketing automation, predictive analytics, and AI capabilities to enhance real estate operations and client engagement.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp is built with a modern web stack emphasizing responsiveness, accessibility, and internationalization.

The frontend uses React 18, TypeScript, Vite, Wouter, and TanStack Query. UI components from Radix UI and Shadcn/ui are styled with Tailwind CSS, supporting responsive design and light/dark themes. Forms are managed with Shadcn Form, `useForm`, and Zod for validation.

The backend, developed with Node.js, Express.js, and TypeScript, provides a RESTful API. It includes role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and integrated OpenAI services. Contract routes incorporate Zod validation, data sanitization, and role-based authorization.

Data is stored in PostgreSQL (Neon serverless) and accessed via Drizzle ORM. The schema supports comprehensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Core architectural features include unified middleware, content adaptation, real-time chat via WebSockets, and advanced functionalities like role-based access control, a sophisticated appointment system, comprehensive property and rental lifecycle management with an offer system, automated contract generation, an HOA module, and a robust notification system. AI capabilities include predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant. The system integrates a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, comprehensive financial accounting, and automated rent collection with payment reminders.

The system implements extensive pagination, sortable columns, and consistent page reset logic. Mobile responsiveness includes SSR-safe auto-switching between card and table views with manual override. Unified filter UX is managed through Popover modals, and performance is optimized using TanStack Query caching and React memoization. Enterprise-grade security includes data encryption (AES-256-GCM), enhanced audit logging, rate limiting, and strict multi-tenant isolation. Performance for external endpoints is optimized with PostgreSQL trigram indexes and lean DTOs. The External Management System includes a comprehensive Kanban board for lead management with drag-and-drop functionality, three distinct views (table, cards, Kanban), and localized status labels. Duplicate detection for clients and leads is implemented using normalized name comparison and phone number matching. Public lead registration is facilitated through permanent URLs for seller and broker registrations. The system supports drag-and-drop sidebar reordering with user role-specific persistence. Contract sections utilize unified token tables for internal and external systems, ensuring multi-tenant isolation, link generation for rental offers and tenant applications, and real-time status updates via intelligent polling. The External Management System now includes a professional quotation system with service line items, automatic 15% administrative fee calculation, PDF generation, shareable public links via tokens, and conversion to maintenance tickets with service snapshot preservation. It also supports 3 selectable PDF design templates (Professional, Modern, Elegant) for rental forms and owner forms, with dual branding (HomesApp and agency logos).

The External Management System now includes comprehensive CRM functionality for leads and clients with:
- Lead activity tracking (calls, emails, meetings, WhatsApp, showings)
- Lead status history with automatic logging when status changes
- Property showings scheduling with outcome tracking and feedback
- Client activity tracking and timeline
- Client property history for tracking tenant/owner relationships across properties
- Client blacklist management with warning and blacklisted statuses
- Lead-to-client conversion with sourceLeadId/convertedToClientId linking
- Improved duplicate detection for lead-to-client conversion errors

## Notifications System
The External Management System features a dedicated notification system separate from the main HomesApp notifications:
- Agency-specific notifications are displayed within the Agency Configuration page (Notifications tab)
- Global notification bell is hidden for external agency users to prevent cross-system notification contamination
- API endpoints for external notifications: GET/PATCH /api/external/notifications, mark-all-read functionality
- Real-time polling (30s interval) for notification count updates
- Notification types include payment reminders, contract updates, appointments, and system alerts
- Priority-based visual indicators (urgent, high, medium, low)
- Mark as read individually or mark all as read functionality

## Tenant and Owner Portal System
The system includes dedicated portal access for tenants and owners:
- Portal credentials management integrated within ExternalRentals page (Portal tab)
- Token-based portal authentication with bcrypt password hashing
- Contract-scoped permissions for secure data isolation
- Portal access includes payment tracking, maintenance reporting, document viewing, and AI chat support

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