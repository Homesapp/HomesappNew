# HomesApp - Smart Real Estate

## Overview
HomesApp is a SaaS platform for intelligent real estate property management in Tulum, Quintana Roo. It streamlines property management tasks including scheduling, client interactions, service coordination, and offer processing. Key features include role-based access, Google Calendar integration, a service provider marketplace, and digital agreement management. The platform aims to lead the Tulum market through advanced commission systems, marketing automation, predictive analytics, and AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
HomesApp utilizes a modern web stack designed for a professional, responsive, accessible, and internationalized user experience.

The frontend is built with React 18, TypeScript, Vite, Wouter, and TanStack Query. UI components from Radix UI and Shadcn/ui are styled with Tailwind CSS for responsive, mobile-first design, including light/dark theme support. Form management uses Shadcn Form, `useForm`, and Zod for validation.

The backend, developed with Node.js, Express.js, and TypeScript, provides a RESTful API. It features role-based middleware, JSON error handling, dual authentication (Replit Auth/OpenID Connect, local, Google OAuth), session management, and integrated OpenAI services. Contract routes incorporate Zod validation, data sanitization, and role-based authorization.

Data is stored in PostgreSQL (Neon serverless) and accessed via Drizzle ORM for type-safe operations. The schema supports extensive management of users, properties, appointments, client presentations, service providers, offers, staff, audit logs, leads, condominiums, reviews, financials, payouts, and rental contracts.

Core architectural features include unified middleware, content adaptation, and real-time chat via WebSockets. The platform offers advanced functionalities such as role-based access control, a sophisticated appointment system, comprehensive property and rental lifecycle management with an offer system, automated contract generation, an HOA module, and a robust notification system. AI capabilities include predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant powered by OpenAI GPT-4. The system also integrates a CRM lead management system, a referral system, Airbnb-style role switching, full i18n support, and an advanced External Property Management System with multi-tenant capabilities, detailed worker and owner management, an external calendar system, rental purpose classification, Google Calendar sync, comprehensive financial accounting, and automated rent collection with payment reminders.

The system implements extensive pagination and sortable columns with consistent page reset logic. Mobile responsiveness includes SSR-safe auto-switching between card and table views, with a manual override. Unified filter UX is managed through Popover modals, and performance is optimized using TanStack Query caching and React memoization. Enterprise-grade security includes data encryption (AES-256-GCM), enhanced audit logging, rate limiting, and strict multi-tenant isolation. Performance for external endpoints is optimized with PostgreSQL trigram indexes and lean DTOs, reducing lookup latency and response payloads. The External Management System includes a comprehensive Kanban board for lead management with drag-and-drop functionality, three distinct views (table, cards, Kanban), and localized status labels. Duplicate detection for clients and leads is implemented using normalized name comparison and phone number matching. Public lead registration is facilitated through permanent URLs for seller and broker registrations. The system supports drag-and-drop sidebar reordering with user role-specific persistence. Contract sections utilize unified token tables for internal and external systems, ensuring multi-tenant isolation, link generation for rental offers and tenant applications, and real-time status updates via intelligent polling.

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