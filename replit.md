# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed to streamline real estate property management, with a specific focus on the Tulum, Quintana Roo market. It supports various user roles (master, admin, seller, owner, client) and offers features such as property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing for property submissions, and a robust back office for offer management. The overarching goal is to dominate the real estate property management sector in Tulum.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is developed using React 18, TypeScript, and Vite. It leverages Wouter for routing and TanStack Query for server state management. UI components are built with Radix UI primitives and Shadcn/ui, styled using Tailwind CSS, and support light/dark themes and internationalization (Spanish/English). The design system emphasizes professionalism and allows for role-switching.

### Backend
The backend is built with Node.js, Express.js, and TypeScript (ESM modules), providing a RESTful API. It features role-based middleware, JSON-based error handling, and a dual authentication system: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage
The application utilizes PostgreSQL (Neon serverless) and Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, and audit logs. It also includes a lead capture system, a `condominiums` table with a three-state approval workflow, and a bidirectional review system. Financial tracking, payout management, and a comprehensive rental contract system are integrated, handling commissions, referrals, and rental income with automated commission calculations based on lease duration and digital signature tracking.

### Key Features and Workflows
*   **Dual-Type Appointment Scheduling**: Supports individual 1-hour slots and 30-minute tour slots for multiple properties, with admin-configurable business hours and concierge time-blocking.
*   **Property Management**: Includes a property approval workflow, owner change requests, auto-approval settings, sublease functionality, and pet-friendly indicators with paw icon display. Properties are standardized to Tulum. Owners can manage their properties through a streamlined list view with quick action dropdowns.
*   **Property Staff & Task Management**: Comprehensive system for assigning staff to properties with role-based assignments (cleaning, maintenance, concierge, accounting, legal). Task management with priorities, assignments, due dates, and status tracking (pending, in progress, completed, cancelled). Built with react-hook-form for robust form validation.
*   **Property Submission**: A 5-step wizard with draft saving, digital agreement signing, and integration with approved condominiums. Features intelligent amenity and service configuration, and a simplified terms and review step with mandatory acceptances.
*   **Condominium & Colony Workflow**: User-suggested condominiums and colonies require admin approval, with pre-approved Tulum condominiums.
*   **Client Dashboard**: Provides a personalized overview with stats, quick actions, and Google Calendar integrated appointment management.
*   **User Experience**: Features Airbnb-style role switching, full i18n support, a WebSocket-based real-time chat, enhanced presentation cards, granular email notification preferences, and streamlined navigation.
*   **Notification System**: A dual-channel (in-app and email) system with configurable email categories, priority-based in-app notifications, SLA tracking, and mark-as-read functionality.
*   **My Properties Views**: Simplified list-view only with dropdown menu for quick property actions (View Details, Edit, Appointments).
*   **Bank Information Management**: Supports Mexican banks (CLABE), Zelle, and Wise for payment account setup.
*   **Public Dashboard**: An Airbnb-inspired design with dual pricing (rental/sale), advanced search filters, and promotional banners.
*   **Virtual Assistant (MARCO)**: An intelligent, humanized chatbot powered by OpenAI GPT-5 for client guidance and appointment coordination.
*   **Referral System**: Role-based referral filtering for secure visibility.
*   **Welcome Modals**: First-time user onboarding modals for clients and property owners.
*   **Service Provider Messaging**: One-click chat initiation from directory listings.
*   **Application System**: A unified application flow for sellers and service providers.
*   **Admin Panel Enhancements**: Includes full English translation, admin profile management, an integrations control center, and a comprehensive contract management system.
*   **Role Request System**: Enhanced with mandatory contact and experience fields for applications.

### System Design Choices
The platform employs unified middleware for consistent authentication, automatic logging for auditing, and a public dashboard that adapts based on user authentication. WebSocket security for real-time chat ensures session-based authentication and per-conversation authorization.

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