# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed to streamline real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client) and offers features such as property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing for property submissions, and a robust back office for offer management, with the ambition to dominate the Tulum real estate market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI components are built with Radix UI and Shadcn/ui, styled with Tailwind CSS, and support light/dark themes and i18n (Spanish/English). The design emphasizes professionalism and role-switching. It implements modern React patterns like PWA for offline support, Context API for centralized state, and custom hooks for domain-specific logic.

### Backend
The backend is built with Node.js, Express.js, and TypeScript (ESM), providing a RESTful API. It features role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage
PostgreSQL (Neon serverless) and Drizzle ORM are used for type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, a `condominiums` table with a three-state approval workflow, and a bidirectional review system. Financial tracking, payout management, and a comprehensive rental contract system are integrated. Performance is optimized with 20 B-tree indexes, improving query times by 50-90%. Security is enhanced with a comprehensive RBAC audit and critical fixes for privilege escalation vulnerabilities. Scalability is addressed through database analysis, with Redis caching implemented for static data to reduce database queries by 50-90%. An automatic error tracking system captures frontend errors, console errors, and unhandled promise rejections, logging them to the database and notifying administrators.

### Key Features and Workflows
*   **Dual-Type Appointment Scheduling**: Supports individual and tour slots with admin-configurable business hours and an owner-initiated reschedule workflow.
*   **Property Approval Workflow**: A multi-stage approval process (draft → pending_review → ... → published) with controlled editing permissions, concierge inspection system, and dedicated API endpoints for state transitions.
*   **Property Management**: Includes owner change requests, auto-approval, sublease, pet-friendly indicators, and custom listing titles.
*   **Property Staff & Task Management**: System for assigning staff to properties with role-based assignments and task tracking.
*   **Property Submission**: A 5-step wizard with draft saving, digital agreement signing, and integration with approved condominiums.
*   **Condominium & Colony Workflow**: User-suggested condominiums/colonies require admin approval, with pre-approved Tulum condominiums.
*   **Client Dashboard**: Personalized overview with stats, quick actions, and Google Calendar integration.
*   **User Experience**: Features Airbnb-style role switching, full i18n support, WebSocket-based real-time chat, enhanced presentation cards, granular email notification preferences, and streamlined navigation.
*   **Notification System**: Dual-channel (in-app and email) with configurable categories and priority-based in-app notifications.
*   **Bank Information Management**: Supports Mexican banks (CLABE), Zelle, and Wise.
*   **Public Dashboard**: Airbnb-inspired design with dual pricing, advanced search, and promotional banners.
*   **Referral System**: Role-based referral filtering.
*   **Admin Panel Enhancements**: Full English translation, admin profile management, integrations control, contract management, and comprehensive CRUD for condominiums, colonies, amenities, and property features.
*   **Automatic Error Tracking**: Captures and logs all frontend errors (React render, unhandled promise, JS errors, console errors) with full context and automatic admin notifications.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging for auditing. The public dashboard adapts based on user authentication. WebSocket security for real-time chat ensures session-based authentication and per-conversation authorization.

## External Dependencies
*   Google Calendar API
*   Neon Database (PostgreSQL)
*   Replit Auth (OpenID Connect)
*   Resend API
*   Radix UI
*   Lucide React
*   date-fns
*   react-day-picker
*   Zod
*   WebSocket (ws)
*   cookie
*   OpenAI GPT-5