# HomesApp - Real Estate Property Management Platform

## Overview

HomesApp is a comprehensive SaaS platform designed for real estate property management, currently focused on the Tulum, Quintana Roo market. It supports multiple user roles (e.g., master, admin, seller, owner, client) to manage properties, schedule appointments, create client presentations, coordinate services, and process offers. Key capabilities include role-based access control, Google Calendar integration, a service provider marketplace, a property submission workflow with digital agreement signing, and a full back office for offer management. The platform aims to streamline property management operations and enhance user experience in the real estate sector with a professional, data-dense dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 5, 2025:**
- Updated logo to final version ("H mes (500 x 300 px)_1759672952263.png") and resized to h-16 across all components
- Header height adjusted to h-16 for more compact design
- Primary brand color changed to #21ad44 (HSL: 141 68% 40%) throughout application
- **Public Home Page Improvements**: Enhanced affiliate banner and reduced spacing for more compact design
  - Affiliate banner now includes professional image matching other carousel banners
  - Added 4th benefit to affiliate program: "Dedicated support and ongoing training"
  - Reduced global spacing throughout home page (py-12→py-8, mb-16→mb-10, mb-12→mb-8)
  - Banner padding reduced (p-6 md:p-8 → p-4 md:p-6) for tighter, more professional look
  - Benefits section spacing reduced (gap-8→gap-6, p-8→p-6)
  - All carousel banners now follow consistent grid layout with images
  - **Component Reordering**: Featured properties now display before promotional banners on home page
- **Subarrendamiento Feature**: Added sublease capability to properties with search filter
  - New allowsSubleasing boolean field in properties table (defaults to false)
  - Filter checkbox in advanced search on public dashboard
  - Backend search endpoint supports allowsSubleasing parameter
  - Full Spanish/English translations for sublease feature
- **Welcome Messages**: Implemented first-time welcome modals for clients and property owners
  - New hasSeenWelcome boolean field in users table for cross-device consistency
  - Role-specific welcome modals with feature highlights
  - Modal shows automatically on first dashboard visit
  - Backend endpoint to mark welcome message as seen (/api/user/mark-welcome-seen)
- **Chat System Fix**: Fixed chat functionality for all users including clients
  - Added "cliente" role to sidebar Mensajes menu for client access
  - Fixed getChatConversations to properly filter by user participation
  - Conversations now filtered via JOIN with chat_participants table
  - Clients can now send messages in conversations where they are participants
  - Improved chat visibility and permissions across all user roles
- **MARCO Virtual Assistant**: Intelligent, humanized chatbot for client property search
  - Named "MARCO" - configurable virtual assistant that guides clients step-by-step
  - Conversational approach: asks one question at a time to avoid overwhelming clients
  - Integration with client presentation cards for personalized recommendations
  - Ability to coordinate appointments for property viewings
  - Full admin configuration page (accessible only to master/admin roles)
    - Configure chatbot name, system prompt, and welcome message
    - Toggle active/inactive status to enable/disable chatbot platform-wide
    - Control capabilities: conversational mode, presentation card suggestions, appointment scheduling
  - Backend validation: chatbot start/message endpoints check isActive flag
  - Frontend respects active status: chatbot button only shows when enabled
  - Database-driven configuration stored in chatbot_config table
  - Uses OpenAI GPT-5 for natural language processing
- Carousel navigation arrows repositioned below carousel content, centered with gap-4 spacing for better UX
- **Location Standardization**: All property locations updated to "Tulum" for consistency and improved search functionality
- **Condominium System**: Created approval workflow for condominiums with 396 pre-approved units
  - Owners/users can request new condominiums (status: pending)
  - Admins approve/reject condominium requests via API endpoints
  - Properties can now be linked to approved condominiums with unit details
  - Full Zod validation and error handling on all condominium routes
- **Client Dashboard**: New dedicated dashboard for clients with appointment management
  - "Mis Citas" section with upcoming, calendar, and history views
  - Integrated calendar showing appointment dates with date selection
  - Video call integration with Google Meet links
  - Appointment status tracking (pending, confirmed, completed, cancelled)
  - Direct booking capability from dashboard
- **Profile Picture Upload**: Implemented device-based image upload for user profiles
  - Users can upload profile pictures directly from their device (no URL required)
  - Images converted to base64 and stored in database
  - File validation: JPG/PNG/GIF formats, maximum 2MB size
  - Profile image displays as thumbnail in UserProfileMenu (top-right)
  - Large avatar preview on profile page with upload/remove controls
  - Smart update logic: only sends image data when actually changed to preserve existing photos
- **Enhanced Public Search**: Advanced search filters in PublicDashboard
  - Toggleable advanced filters section with SlidersHorizontal icon button
  - Property type dropdown (Casa, Departamento, Villa, Loft, Penthouse, Estudio, Townhouse)
  - Colony name and condominium name text inputs
  - Clear filters button to reset all search criteria
  - Updated search placeholder: "Buscar por ubicación, colonia, condominio o descripción..."
  - Backend support for propertyType, colonyName, condoName, unitType filters
  - Search parameters use "q" for text query, properly mapped to filters in API
- **Service Provider Messaging**: Implemented real-time messaging with service providers
  - One-click chat initiation from provider cards in Directory
  - Creates internal conversation with provider title
  - Properly adds both current user (as creator) and provider as participants
  - Redirects to chat page with new conversation ready to use
  - Integrated with existing WebSocket chat infrastructure
- **Property Owner Controls**: Enhanced property management for owners
  - Property deletion with confirmation dialog in OwnerPropertyDetails
  - Backend permission checks ensure only owners/admins can delete
  - Property edit workflow uses change request system (requires admin approval)
- **Bug Fixes**: Fixed critical type safety issues in WebSocket and API handling
  - WebSocket null safety checks for conversation IDs
  - Proper type casting for API responses in Directory component
  - Service provider data correctly loaded via hooks
- **Chatbot Internationalization**: Updated virtual assistant name to be language-aware
  - Chatbot now identifies as "Marco-IA" in Spanish and "Marco-AI" in English
  - System prompts adapt automatically to user's preferred language
  - Responses generated in appropriate language (Spanish/English) based on user preference
  - Enhanced multilingual support for property search conversations
- **Profile Page Translation**: Completed internationalization of client profile page
  - All text elements now use translation system for Spanish/English support
  - Added comprehensive translations for profile page UI elements
  - Profile updates, error messages, and form labels fully translated
  - Date formatting respects user's language preference (Spanish/English locale)
- **Language Persistence System**: Implemented robust language selection persistence across authentication
  - Three-effect architecture in LanguageContext for reliable language management
  - Effect 1 (Initial sync): Prefers localStorage over user profile on login, syncs to backend
  - Effect 2 (Backend updates): Updates backend when authenticated users change language
  - Effect 3 (localStorage sync): Persists all language changes to browser storage
  - Pre-login language selection correctly preserved after authentication
  - Login and Register pages fully translated with 40+ translation keys
  - Language toggle works correctly for both authenticated and unauthenticated users
  - Backend schema updated to support language-only profile updates (optional firstName/lastName)
  - No infinite loops or reversion issues in language synchronization

## System Architecture

### Frontend

The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing and TanStack Query for server state management. UI components are built with Radix UI primitives and Shadcn/ui, styled with Tailwind CSS, supporting light/dark themes and internationalization (Spanish/English). It features a professional design system and role-switching capabilities (owner/client).

### Backend

The backend uses Node.js with Express.js and TypeScript (ESM modules), providing a RESTful API with role-based middleware and JSON-based error handling. It employs a dual authentication system: Replit Auth (OpenID Connect) for regular users and local username/password for administrators, including session management and user approval workflows.

### Data Storage

The application uses PostgreSQL (Neon serverless) and Drizzle ORM for type-safe interactions. The schema supports user management, property statuses, appointment scheduling, client presentation cards, service providers, offer workflows, and staff assignments, with audit logs for critical actions. A lead capture system tracks user actions and manages rental opportunity requests.

**Condominium Management**: A dedicated `condominiums` table manages approved condominium listings with a three-state approval workflow (pending/approved/rejected). Properties can reference condominiums and include unit-specific details (unitType, unitNumber, condoName). The system includes 396 pre-approved condominiums from the Tulum market. API endpoints enforce role-based access (admin-only approval/rejection) with full Zod validation.

### Key Features and Workflows

*   **Property Management**: Includes a property approval workflow (draft → pending → approved/rejected), owner-submitted change requests with admin approval, and owner settings for appointment auto-approval. All properties are standardized to Tulum location for consistency.
*   **Property Submission**: A multi-step wizard with automatic draft saving, digital agreement signing using admin-managed templates, and audit logging for all agreement actions. Integration with approved condominium listings for properties within condominiums.
*   **Condominium Workflow**: User-requested condominiums require admin approval before appearing in selection lists. Admins can approve/reject requests with full audit trail. 396 pre-approved Tulum condominiums available in the system.
*   **Client Dashboard**: Dedicated dashboard for clients featuring appointment management with calendar integration, upcoming appointments display, appointment history, and direct booking capabilities. Supports video call integration with Google Meet.
*   **User Experience**: Features an Airbnb-style role switching, full i18n support, a WebSocket-based real-time chat system with secure authentication, enhanced presentation cards with detailed property and client information, and granular email notification preferences.
*   **Public Dashboard**: An Airbnb-inspired design adapting for authenticated vs. non-authenticated users, with dual pricing support (rental/sale) and improved property listing displays.

### System Design Choices

The platform uses a unified middleware for consistent authentication handling (`req.user`), automatic logging for auditing, and a public dashboard that adapts its experience based on user authentication. A calendar view for appointments and detailed user profiles are also included. WebSocket security for the real-time chat implements session-based authentication, per-conversation authorization, and secure connection handling.

## External Dependencies

*   **Google Calendar API**: For event creation and management.
*   **Neon Database**: Serverless PostgreSQL.
*   **Replit Auth**: OpenID Connect provider for user authentication.
*   **Resend API**: For email notifications.
*   **Radix UI**: Primitive component library.
*   **Lucide React**: Icon library.
*   **date-fns**: Date manipulation.
*   **react-day-picker**: Calendar component.
*   **Zod**: Runtime type validation.
*   **WebSocket (ws)**: Server-side WebSocket implementation.
*   **cookie**: Cookie parsing.