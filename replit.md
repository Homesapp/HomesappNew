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