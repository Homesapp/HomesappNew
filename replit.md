# HomesApp - Smart Real Estate

## Overview
HomesApp is a comprehensive SaaS platform for smart real estate property management in Tulum, Quintana Roo. It supports multiple user roles and offers features for property management, appointment scheduling, client presentations, service coordination, and offer processing with counter-negotiation. The platform aims to provide a professional, data-rich user experience with robust role-based access, Google Calendar integration, a service provider marketplace, digital agreement signing, legal document elaboration, and a powerful back office. Its strategic ambition is to dominate the Tulum real estate market through advanced commission systems, marketing automation, predictive analytics, and AI-powered functionalities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built on a modern web stack, prioritizing a professional, responsive, accessible, and internationalized user experience.

### Frontend
The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI and Shadcn/ui, styled using Tailwind CSS, supporting light/dark themes. Forms are managed with Shadcn Form, `useForm`, and `zodResolver`, employing Zod for validation. A mobile-first design approach is implemented.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, offering a RESTful API. It includes role-based middleware, JSON error handling, and dual authentication mechanisms (Replit Auth/OpenID Connect, local username/password, Google OAuth). Session management, user approval workflows, and centralized OpenAI service integration (GPT-4 model) are core functionalities. Contract routes feature strict Zod validation, data sanitization, and role-based authorization.

### Data Storage
PostgreSQL, provided by Neon serverless, is used with Drizzle ORM for type-safe database interactions. The schema supports comprehensive user management, property lifecycle, appointment scheduling, client presentation cards, service providers, offer workflows, staff assignments, audit logs, lead capture, condominium management, a bidirectional review system, financial tracking, payout management, and a robust rental contract system.

### System Design Choices
The platform employs unified middleware for consistent authentication and automatic logging. The public dashboard dynamically adapts content based on user authentication status. Real-time chat is implemented via WebSockets with session-based authentication and per-conversation authorization.

Key features include:
*   **Role-Based Access Control**: Granular permissions across all user types.
*   **Advanced Appointment System**: Dual-type scheduling with concierge assignment and dynamic slot availability.
*   **Property Management Lifecycle**: Property approval workflows, two-stage publication, owner change requests, sublease functionality, comprehensive photo editing, and a 7-step property submission wizard with digital agreement signing.
*   **Rental Management**: Active rental portals for clients and owners, including service-based payment tracking, owner payment approval, and tenant maintenance requests.
*   **Rental Opportunity & Offer System**: Workflow for clients to request and create rental offers, followed by a bidirectional counter-offer negotiation system.
*   **Contract Elaboration System**: Automated workflow after offer acceptance, involving forms, admin verification, lawyer elaboration, tripartite chat, and digital signatures.
*   **HOA Module**: Complete condominium management system for admin, owner, and HOA Manager roles.
*   **Comprehensive Notification System**: Full-featured system with real-time updates, filtering, priority levels, email integration, and user preferences.
*   **AI-Powered Capabilities**: Predictive analytics, automated legal document generation, intelligent tenant screening, and a virtual assistant (MARCO) powered by OpenAI GPT-4.
*   **CRM Lead Management System**: Kanban-style lead management with a 10-stage rental pipeline.
*   **Referral System**: Sellers can refer property owners and earn 20% commission per referred property.
*   **User Experience**: Airbnb-style role switching, full i18n support, real-time chat, granular email notification preferences, and 30-minute auto-logout security.
*   **Public Rental Form**: Comprehensive 8-step wizard for tenants to submit rental applications with guarantor option, featuring bilingual support and robust validation.
*   **Property Invitation Token System**: Secure token-based property submission system allowing admins to generate time-limited, single-use invitation links for property owners to submit properties without creating accounts.
*   **Sidebar Menu Visibility Control**: Admin configuration system allowing master and admin users to control sidebar menu item visibility for specific roles and individual users, with database-driven configurations and per-user overrides.
*   **Internationalization (i18n) System**: Comprehensive bilingual support (Spanish/English) with modular translation files organized by domain.
*   **Social Media Integration**: Proper Open Graph meta tags for clean link previews on WhatsApp, Facebook, and Twitter with professional titles, descriptions, and images.

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

## Recent Technical Improvements

### Property Invitation Token Bug Fix (November 2025)
Fixed critical production bug preventing admin users from creating property invitation tokens.

**Problem:** Error 500 with FK constraint violation when admins attempted to create invitation tokens because OIDC-authenticated admins did not exist in the `users` table.

**Root Causes:**
1. Admin users authenticated via Replit Auth (OIDC) were not automatically persisted to the `users` table
2. Email addresses from OIDC claims could be null or duplicate across different users
3. Race conditions in concurrent requests with duplicate emails caused UNIQUE constraint violations

**Solution:** Implemented atomic `upsertUser` method with intelligent email handling:
- Uses `onConflictDoUpdate` with user ID as target for atomic idempotent upserts
- Automatically generates fallback emails (`user-${id}@homesapp.internal`) when claims email is null
- Implements retry logic to handle duplicate email race conditions (error code 23505)
- Preserves existing user emails on updates to maintain identity consistency
- Allows legitimate email updates when new address is unique
- Guarantees FK constraints are satisfied before token creation

**Impact:** Property invitation token creation now works reliably in production, even under concurrent load with duplicate or null email addresses from OIDC providers.

### Client-Side Image Compression System (November 2025)
Implemented automatic image compression with real-time progress tracking to prevent upload size errors and improve user experience.

**Features:**
- **Automatic Compression**: Images are compressed client-side before upload using Canvas API
- **Smart Format Preservation**: Maintains original format (JPEG, PNG, WebP) including transparency
- **Quality Settings**: Max dimensions 1920x1920px, quality 0.85 for optimal balance
- **Real-Time Progress**: Individual progress bars (0-100%) for each image being compressed
- **Multiple Uploads**: Supports simultaneous compression of multiple images with independent progress tracking
- **User Feedback**: Toast notifications showing compression statistics when reduction exceeds 10%

**Implementation:**
- **File**: `client/src/lib/imageCompression.ts` - Canvas-based compression utility
- **Component**: `client/src/components/wizard/Step5Media.tsx` - Property wizard media step
- **State Management**: Map-based tracking for concurrent uploads with automatic cleanup
- **Server Limits**: Increased to 100MB (Express) and 20MB (Multer) as backup for compressed payloads

**Technical Details:**
- Transparency detection preserves alpha channel for PNG and WebP
- Progress callbacks update UI in real-time during compression
- Disabled upload buttons during active compression to prevent conflicts
- Compression ratio calculation for user feedback
- Automatic format selection based on source type and transparency

**Impact:** Users can now upload large images without errors, with clear visual feedback during compression. The system automatically reduces file sizes while maintaining image quality, improving upload speeds and reducing server load.

### Property Wizard Performance Optimization (November 2025)
Fixed slow save times in wizard steps 4-7 after uploading photos in step 3 by implementing intelligent payload management.

**Problem:** After uploading photos in step 3, steps 4-7 took very long to save because each step was sending ALL wizard data (including MB of base64 images) to the server via PATCH requests.

**Root Cause Analysis:**
- `handleNext` was sending entire `wizardData` object in every step
- After uploading 5-10 compressed images (~2-5MB total in base64), steps 4-7 were sending this payload unnecessarily
- Network I/O was the bottleneck, not in-memory comparisons

**Solution:**
- **Smart Payload Management**: Modified `handleNext` to send only step-specific data
  - Step 1: Sends only `basicInfo` (~1-2KB)
  - Step 2: Sends only `locationInfo` + `details` (~1-2KB)
  - Step 3: Sends only `media` (compressed images)
  - **Step 4: Sends only `servicesInfo` (~1KB), NOT images** ← Critical optimization
  - Step 5: Sends only `accessInfo` (~1KB)
  - Step 6: Sends only `ownerData` (~2KB)
  - Step 7: Sends only `commercialTerms` (~1KB)

**Code Change** (`client/src/pages/PropertySubmissionWizard.tsx` lines 369-373):
```typescript
// Only send the step's delta data, not the entire wizardData
const dataToSave = stepData && Object.keys(stepData).length > 0
  ? { ...stepData, currentStep: nextStep }  // Only step data
  : { currentStep: nextStep };              // Or just step number
```

**Technical Details:**
- Kept `hasDataChanged` with full JSON.stringify for reliability (no data loss risk)
- Backend `.returning()` returns complete draft record after PATCH
- Initial draft creation still sends full payload (acceptable, happens once)

**Impact:** Steps 4-7 now save as fast as steps 1-2 (1-2KB payloads instead of 2-5MB), dramatically improving wizard UX after photo upload.

### Separate Rental and Sale Pricing with Deep JSONB Merge (November 2025)
Implemented independent price and currency fields for rental and sale transactions, with deep merge functionality to prevent data loss during partial wizard saves.

**Problem:** Properties needed separate rental and sale prices with independent currency selection (MXN/USD), but partial step saves were causing data concatenation/corruption in JSONB columns (e.g., rentalPrice showing "250005500000" instead of "25000").

**Root Causes:**
1. No separate fields for rental vs sale pricing in Step 1
2. Backend was replacing entire JSONB columns on partial updates instead of merging
3. Drizzle `.set({ ...updates })` with partial data overwrote existing keys causing data loss

**Solution:**
- **Frontend - Dual Price Fields** (`client/src/components/wizard/Step1BasicInfo.tsx`):
  - Added rentalPrice, rentalPriceCurrency, salePrice, salePriceCurrency to Step 1
  - Conditional validation: rentalPrice required if isForRent, salePrice required if isForSale
  - Dynamic UI: price sections show/hide based on transaction type checkboxes
  - Backward compatibility: legacy price/currency fields auto-migrated to new structure in defaultValues
  - Legacy fields maintained in onSubmit for downstream components (Step5TermsReview, Step7Review)

- **Backend - Deep JSONB Merge** (`server/storage.ts`):
  - Implemented `deepMerge` helper that recursively merges objects while preserving existing keys
  - `updatePropertySubmissionDraft` now loads existing draft before updating
  - Merges 8 JSONB columns deeply: basicInfo, locationInfo, details, media, servicesInfo, accessInfo, ownerData, commercialTerms
  - Arrays and primitives replaced completely, only nested objects merged recursively
  - Prevents data loss when saving only partial step data (e.g., Step 2 locationInfo without Step 1 basicInfo)

**Technical Implementation:**
```typescript
// Deep merge prevents data loss on partial updates
const deepMerge = (target: any, source: any): any => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source; // Replace primitives and arrays completely
  }
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    return source; // If target isn't an object, use source
  }
  
  const result = { ...target }; // Start with all target keys
  for (const key in source) {
    if (source[key] !== undefined) {
      result[key] = deepMerge(target[key], source[key]); // Recursively merge
    }
  }
  return result;
};
```

**Validation:**
- E2E test confirmed rentalPrice="35000" and salePrice="6500000" persist correctly
- No concatenation when navigating between wizard steps
- Database stores clean JSON without string corruption
- Performance optimization (partial payload) preserved

**Impact:** Users can now specify different prices for rental and sale with independent currency selection, while the deep merge system ensures data integrity across all wizard steps with no performance regression.