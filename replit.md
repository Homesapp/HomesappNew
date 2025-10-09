# HomesApp - Real Estate Property Management Platform

## Overview
HomesApp is a comprehensive SaaS platform designed to streamline real estate property management in Tulum, Quintana Roo. It supports multiple user roles (master, admin, seller, owner, client) and offers features such as property management, dual-type appointment scheduling, client presentations, service coordination, and offer processing. The platform aims to provide a professional, data-rich user experience with role-based access, Google Calendar integration, configurable business hours, a service provider marketplace, digital agreement signing for property submissions, and a robust back office for offer management, with the ambition to dominate the Tulum real estate market. The platform has expanded its business model with enhanced commission systems, a service provider marketplace, marketing automation, preventive maintenance, and enhanced referral tracking. It also incorporates AI-powered features for predictive analytics, automated legal document generation, and intelligent tenant screening.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI components are built with Radix UI and Shadcn/ui, styled with Tailwind CSS, and support light/dark themes and i18n (Spanish/English). The design emphasizes professionalism and role-switching. All frontend pages use shadcn Form + useForm + zodResolver with Zod validation. It includes comprehensive error handling, loading states, full i18n support, data-testid attributes for testing, and responsive design with accessibility features.

### Backend
The backend is built with Node.js, Express.js, and TypeScript (ESM), providing a RESTful API. It features role-based middleware, JSON error handling, and dual authentication: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows. OpenAI service is centralized at `server/services/openai.ts` using the GPT-4 model.

### Data Storage
PostgreSQL (Neon serverless) and Drizzle ORM are used for type-safe database interactions. The schema supports user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, a `condominiums` table with a three-state approval workflow, and a bidirectional review system. Financial tracking, payout management, and a comprehensive rental contract system are integrated, handling commissions, referrals, and rental income with automated commission calculations and digital signature tracking. An automatic error tracking system captures frontend errors, console errors, and unhandled promise rejections, logging them to the database and notifying administrators.

The schema includes:
- **Condominiums**: Linked to colonies via `colonyId` foreign key.
- **Colonies**: Standalone entities.
- **Amenities**: Categorized as property or condominium amenities.
- **Property Features**: Custom characteristics for properties with optional icons.
- **Commission Advances**: Tracks seller requests, amounts, and status.
- **Service Favorites**: Links users to favorite service providers.
- **Predictive Analytics**: Stores analysis type, predictions, confidence scores.
- **Legal Documents**: Stores document type, content, extracted terms, metadata.
- **Tenant Screenings**: Stores application data, AI analysis, risk scores, flags, recommendations.
- **Marketing Campaigns**: Stores message templates, audience targeting, delivery tracking.
- **Maintenance Schedules**: Tracks property linking, task types, frequencies, completion.
- **Rental Payments**: Tracks monthly rental payments with status (paid/pending/overdue), amount, due date, and payment date.
- **Tenant Maintenance Requests**: Client-submitted maintenance requests with urgency levels, descriptions, and status tracking.

Performance is optimized with 20 B-tree indexes for critical tables (Properties, Appointments, Income Transactions) resulting in significant query speed improvements. Security enhancements include a comprehensive Authorization Audit, patching of privilege escalation vulnerabilities, and enhanced role validation. Scalability assessment indicates the system can handle 5,000-10,000 daily active users with current optimizations.

### Key Features and Workflows
*   **Dual-Type Appointment Scheduling**: Supports individual and tour slots with configurable business hours and a reschedule workflow.
*   **Property Management**: Includes property approval workflow, owner change requests, auto-approval settings, sublease functionality, pet-friendly indicators, custom listing titles, and enhanced photo gallery display. Owner property details page features optimized main image height (33.5rem) matching 4 thumbnail heights, redesigned services section with three categories (included, not included, additional), and improved MyProperties cards with 112x112px images and bordered price tiles. **Photo Editing System**: Complete photo management interface in EditOwnerProperty page allows owners to add photos by URL, delete photos, reorder photos (move up/down), and select cover image with visual badge indicator. All photos are consolidated into primaryImages array with automatic cleanup of legacy secondaryImages/images arrays. Changes submitted through change request workflow for admin approval, ensuring photo deletions persist across reloads. **Photo Display Migration (Oct 2025)**: All property listing views migrated to use primaryImages field instead of deprecated images array. Updated components include PublicDashboard, Dashboard, PropertySearch, PropertyDetails, PropertyFullDetails, and Favorites. Database schema uses primary_images (snake_case) column mapped to primaryImages (camelCase) via Drizzle ORM.
*   **Property Staff & Task Management**: System for assigning staff to properties with role-based assignments and task tracking.
*   **Property Submission**: A 5-step wizard with draft saving, digital agreement signing, and integration with approved condominiums.
*   **Condominium & Colony Workflow**: User-suggested condominiums/colonies require admin approval.
*   **Client Dashboard**: Personalized overview with stats, quick actions, and Google Calendar integration.
*   **Enhanced Owner Dashboard**: Comprehensive dashboard with automated financial reporting (total earnings, paid/pending amounts, category breakdown) and preventive maintenance calendar (30-day view with urgency indicators). Integrates `/api/income/my-summary` and `/api/owner/maintenance-schedules` endpoints.
*   **User Experience**: Features Airbnb-style role switching, full i18n support, WebSocket-based real-time chat, enhanced presentation cards, granular email notification preferences, and streamlined navigation.
*   **Notification System**: Dual-channel (in-app and email) with configurable categories and SLA tracking.
*   **Admin CRUD System**: Full create/read/update/delete capabilities for condominiums, colonies, amenities, and property features. Includes an Admin Draft Management System for comprehensive visualization and filtering of property drafts.
*   **Automatic Error Tracking**: Comprehensive monitoring for frontend errors, unhandled promise rejections, window JavaScript errors, and console errors, with notifications to administrators.
*   **Property Limit System**: Owner property count control with a request/approval workflow for limit increases.
*   **Enhanced Commission System**: Includes commission advances for sellers with forecasting.
*   **Enhanced Service Provider Marketplace**: Features service favorites and expanded bidirectional reviews.
*   **Predictive Analytics (OpenAI GPT-4)**: AI-powered rental probability analysis, price recommendations, and market trend forecasting.
*   **Automated Legal Document Generation (OpenAI GPT-4)**: Smart contract generation, terms extraction, and renewal reminders.
*   **Intelligent Tenant Screening (OpenAI GPT-4)**: Automated application analysis, risk scoring, red flag detection, and actionable recommendations.
*   **Marketing Automation**: Campaign management, audience segmentation, performance tracking, and scheduling.
*   **Preventive Maintenance System**: Scheduling, task tracking, and automated reminders for property owners.
*   **Enhanced Referral Tracking**: Automatic commission attribution and performance analytics. Includes bank account field for commission payments in Referrals page.
*   **Client Active Rentals Management**: Comprehensive tenant portal for managing active rentals, viewing payment history with status tracking (paid/pending/overdue), and submitting maintenance requests with urgency levels. Security-hardened endpoints filter sensitive owner data from client responses.
*   **Owner Active Rentals Management**: Dedicated owner portal at `/owner/active-rentals` providing tabbed interface for managing rental properties. Features include contract visualization (monthly rent, deposit, lease dates, check-in date), property delivery inventory management (room-by-room items with condition tracking, utility meter readings, keys/access cards), and tenant information display (move-in form data including emergency contacts, vehicle details, pet info). Backend enforces ownership verification on all endpoints with Zod validation on POST operations. Supports bilingual interface (Spanish/English).
*   **Virtual Assistant (MARCO)**: OpenAI GPT-5 powered chatbot for client guidance.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging for auditing. The public dashboard adapts based on user authentication. WebSocket security for real-time chat ensures session-based authentication and per-conversation authorization. A development-only authentication endpoint (`/api/auth/test/set-role`) allows role switching for testing purposes.

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