# HomesApp - Role Permissions Matrix

## Overview

HomesApp uses a role-based access control (RBAC) system to manage user permissions across all modules. This document outlines the complete permissions matrix for all roles in the system.

## Role Definitions

### TRH Internal Roles

| Role | Description | Scope |
|------|-------------|-------|
| `master` | Super administrator with full system access | Global |
| `admin` | System administrator | Global |
| `admin_jr` | Junior administrator with limited admin capabilities | Global |
| `seller` | TRH rental agent (agente de renta) | TRH Properties |
| `management` | Property management staff | TRH Properties |
| `sales_agent` | Homesapp sales agent (agente de ventas) | Sales Properties |
| `concierge` | Concierge staff for appointments | TRH Properties |
| `owner` | Property owner with portal access | Own Properties |
| `cliente` | Client/tenant with limited access | Own Applications |

### External Agency Roles

| Role | Description | Scope |
|------|-------------|-------|
| `external_agency_admin` | Admin of external broker agency | Own Agency |
| `external_agency_seller` | External sales representative | Own Leads/Assigned Properties |
| `external_agency_accounting` | Agency accounting staff | Own Agency Finances |
| `external_agency_maintenance` | Agency maintenance staff | Own Agency Maintenance |
| `external_agency_concierge` | Agency appointment coordinator | Own Agency Appointments |
| `external_agency_lawyer` | Agency legal counsel | Own Agency Contracts |
| `external_agency_staff` | General agency staff | Own Agency |

---

## Permissions Matrix

Legend:
- **N** = No Access
- **R** = Read Only
- **RW** = Read/Write
- **O** = Own records only
- **A** = Agency-scoped (filtered by agencyId)

### Module: Leads & Kanban

| Role | View Leads | Create Leads | Edit Leads | Kanban Board | Reassign Leads |
|------|------------|--------------|------------|--------------|----------------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW | RW |
| seller (TRH) | O | RW | O | O | N |
| management | RW | RW | RW | RW | RW |
| sales_agent | O | RW | O | O (Sales) | N |
| concierge | N | N | N | N | N |
| owner | N | N | N | N | N |
| cliente/tenant | N | N | N | N | N |
| external_agency_admin | A | A | A | A | A |
| external_agency_seller | O | RW | O | O | N |
| external_agency_accounting | R(A) | N | N | N | N |
| external_agency_maintenance | N | N | N | N | N |
| external_agency_concierge | R(A) | N | N | N | N |
| external_agency_lawyer | R(A) | N | N | N | N |

### Module: Properties / Rental Listings (TRH)

| Role | View All | View Own | Create | Edit | Publish |
|------|----------|----------|--------|------|---------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW | RW |
| seller (TRH) | R | RW | RW | RW | N |
| management | RW | RW | RW | RW | RW |
| sales_agent | N | N | N | N | N |
| concierge | R | N | N | N | N |
| owner | N | O | O | O | N |
| cliente/tenant | N | N | N | N | N |
| external_agency_admin | N | N | N | N | N |
| external_agency_seller | N | N | N | N | N |

### Module: Properties / Sale Listings (Homesapp)

| Role | View All | View Own | Create | Edit | Publish |
|------|----------|----------|--------|------|---------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW | RW |
| seller (TRH) | N | N | N | N | N |
| management | N | N | N | N | N |
| sales_agent | R | O | RW | O | N |
| concierge | N | N | N | N | N |
| owner | N | O | N | N | N |
| cliente/tenant | N | N | N | N | N |
| external_agency_admin | A | A | A | A | A |
| external_agency_seller | N | O | N | O | N |

### Module: External Agency Properties (Catalog)

| Role | View All | View Assigned | Create | Edit | Social Media |
|------|----------|---------------|--------|------|--------------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| external_agency_admin | A | A | A | A | A |
| external_agency_seller | N | O | N | N | O |
| external_agency_accounting | R(A) | N | N | N | N |
| external_agency_maintenance | R(A) | N | N | N | N |
| external_agency_staff | R(A) | N | N | N | N |

### Module: Contracts (Rental)

| Role | View All | View Own | Create | Edit | Sign |
|------|----------|----------|--------|------|------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW | RW |
| seller (TRH) | N | O | N | N | N |
| management | RW | RW | RW | RW | RW |
| concierge | N | N | N | N | N |
| owner | N | O | N | N | O |
| cliente/tenant | N | O | N | N | O |
| external_agency_admin | A | A | A | A | N |
| external_agency_seller | N | O | N | N | N |
| external_agency_lawyer | A | A | A | A | N |

### Module: Contracts (Sale)

| Role | View All | View Own | Create | Edit | Close |
|------|----------|----------|--------|------|-------|
| master | RW | RW | RW | RW | RW |
| admin | RW | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW | RW |
| seller (TRH) | N | N | N | N | N |
| sales_agent | N | O | RW | O | O |
| management | N | N | N | N | N |
| owner | N | O | N | N | N |
| cliente/tenant | N | N | N | N | N |

### Module: Valuations (CMA)

| Role | View All | View Own | Create | Complete |
|------|----------|----------|--------|----------|
| master | RW | RW | RW | RW |
| admin | RW | RW | RW | RW |
| admin_jr | RW | RW | RW | RW |
| sales_agent | N | O | RW | O |
| owner | N | R(O) | N | N |
| external_agency_admin | A | A | A | A |
| external_agency_seller | N | O | N | N |

### Module: Portal - Tenant

| Role | Access | View Contract | Submit Maintenance | Make Payments |
|------|--------|---------------|-------------------|---------------|
| tenant | O | O | O | O |
| cliente | O | O | O | O |
| master | RW (Support) | RW | RW | N |
| admin | RW (Support) | RW | RW | N |

### Module: Portal - Owner

| Role | Access | View Properties | View Financials | Request Valuations |
|------|--------|-----------------|-----------------|-------------------|
| owner | O | O | O | O |
| master | RW (Support) | RW | RW | N |
| admin | RW (Support) | RW | RW | N |

### Module: Social Media / Marketing

| Role | View Templates | Use Tools | Manage Agency Templates |
|------|----------------|-----------|------------------------|
| master | RW | RW | RW |
| admin | RW | RW | RW |
| seller (TRH) | R | O | N |
| sales_agent | R | O | N |
| external_agency_admin | A | A | A |
| external_agency_seller | R(A) | O | N |

### Module: External Agency Panel

| Role | Dashboard | Team Mgmt | Leads | Properties | Contracts | Accounting |
|------|-----------|-----------|-------|------------|-----------|------------|
| external_agency_admin | A | A | A | A | A | A |
| external_agency_seller | O | N | O | O | N | N |
| external_agency_accounting | A | N | R | R | R | A |
| external_agency_maintenance | A | N | N | R | N | N |
| external_agency_concierge | A | N | R | R | N | N |
| external_agency_lawyer | A | N | R | N | A | N |
| external_agency_staff | A | N | R | R | R | N |

---

## Backend Authorization

### Middleware Implementation

All API routes use the following authorization middleware:

```typescript
// Authentication check
isAuthenticated - Verifies user is logged in

// Role-based access
requireRole(["role1", "role2"]) - Restricts to specific roles

// Agency isolation (for external users)
agencyId filtering - All queries filtered by user's externalAgencyId
```

### Multi-Tenant Isolation

External agency users are always filtered by their `externalAgencyId`:

1. **API Level**: All external routes filter by `agencyId` from the authenticated user
2. **Database Level**: Queries always include `WHERE agency_id = :userAgencyId`
3. **UI Level**: Frontend only shows navigation items relevant to the user's role

### Key Route Groups

| Route Pattern | Description | Protected By |
|---------------|-------------|--------------|
| `/api/admin/*` | Admin operations | `requireRole(["master", "admin"])` |
| `/api/external/*` | External agency operations | Agency ID isolation |
| `/api/sale-*` | Sales module | `requireRole(["master", "admin", "admin_jr", "sales_agent"])` |
| `/api/leads` | Lead management | Role + ownership checks |
| `/api/portal/*` | Portal access | Token-based + role checks |

---

## Frontend Route Protection

### ProtectedRoute Component

All protected pages use the `<ProtectedRoute>` component:

```tsx
<ProtectedRoute allowedRoles={["admin", "master", "sales_agent"]}>
  <SalesAgentDashboard />
</ProtectedRoute>
```

### Role Groups (client/src/components/ProtectedRoute.tsx)

```typescript
ROLE_GROUPS = {
  mainAdmins: ["admin", "master", "admin_jr"],
  externalAdmins: ["external_agency_admin"],
  externalStaff: ["external_agency_admin", "external_agency_accounting", 
                  "external_agency_maintenance", "external_agency_staff"],
  externalSellers: ["external_agency_seller"],
  externalAll: [all external roles],
  owners: ["owner"],
  sellers: ["seller"],
}
```

---

## Role-Specific Access Summary

### TRH Admin (master/admin)
- **Full access** to all modules
- Can view and manage all agencies, users, properties, contracts
- Can impersonate other users for support
- Manages system configuration

### TRH Rental Agent (seller)
- Access to TRH rental properties and leads
- Can create appointments with leads
- Manages own rental pipeline
- Access to commission tracking

### Homesapp Sales Agent (sales_agent)
- Access to sales properties only
- Manages buyer leads through sales pipeline
- Creates and manages sale offers and contracts
- Performs property valuations (CMA)
- No access to rental operations

### External Agency Admin (external_agency_admin)
- **Full access within own agency only**
- Manages team (create/invite/deactivate sellers)
- Views all leads for their agency
- Reassigns leads between agency sellers
- Access to all agency properties (rental and/or sale)
- Views agency contracts
- Access to social media tools for agency properties
- Views agency dashboard and reports

### External Seller (external_agency_seller)
- Access to assigned leads only
- Views assigned properties from agency catalog
- Uses social media tools for assigned properties
- Limited contract visibility
- Access to personal performance metrics

### Owner
- Portal access only
- Views own properties and their status
- Sees financial summaries
- Can request valuations
- Signs contracts when required

### Tenant/Client
- Portal access only
- Views active rentals and contract
- Can submit maintenance requests
- Access to payment history
- "Mis Solicitudes" for tracking applications

---

## Security Considerations

1. **Agency Isolation**: External users can NEVER access data from other agencies
2. **Ownership Checks**: Sellers/agents only see their assigned records
3. **Audit Logging**: All sensitive operations are logged
4. **Rate Limiting**: API endpoints have rate limits
5. **Session Management**: PostgreSQL-backed sessions with expiration

---

## Adding New Modules

When adding a new module:

1. Add route middleware with appropriate `requireRole()`
2. Filter queries by `agencyId` for external users
3. Add ownership checks for seller-level access
4. Update sidebar in `AppSidebar.tsx` with role filtering
5. Add `ProtectedRoute` wrapper in `App.tsx`
6. Update this document with new permissions

---

Last Updated: December 2024
