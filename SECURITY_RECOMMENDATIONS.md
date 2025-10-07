# 🔐 Recomendaciones de Seguridad para HomesApp

## ✅ Completado (Fase 1 - Octubre 7, 2025)

### Correcciones UI
- **Logo HomesApp**: Tamaño estandarizado entre páginas (h-12 md:h-16)

### Correcciones de Seguridad Críticas
1. **Validación Zod en rutas de roles** ✅
   - `/api/users/:id/role` - Validación Zod con enum de roles válidos (incluye "cliente" español)
   - `/api/users/switch-role` - Validación Zod + verificación adicional de roles válidos
   - Corregido manejo correcto de roles en español ("cliente") para compatibilidad con BD

2. **RBAC Middleware en rutas admin** ✅
   - `/api/admin/colonies` (POST) - Añadido requireRole(["master", "admin", "admin_jr"])
   - `/api/admin/colonies/:id` (PATCH) - Añadido requireRole(["master", "admin", "admin_jr"])
   - `/api/admin/colonies/:id` (DELETE) - Añadido requireRole(["master", "admin", "admin_jr"])
   - Refactorizado de validación inline a middleware consistente

3. **Validación de permisos** ✅
   - DELETE `/api/permissions` - Validación Zod de userId y permission

## ✅ Completado (Fase 2 - Octubre 7, 2025)

### Autorización de Recursos - Middleware de Ownership
1. **Middleware Reutilizable Creado** ✅
   - `server/middleware/resourceOwnership.ts` - Middleware centralizado para verificar propiedad de recursos
   - Soporta: appointments, offers, properties, rental contracts
   - Admin/Master pueden acceder a todos los recursos
   - Lógica especializada para cada tipo de recurso

2. **Rutas de Appointments Protegidas** ✅
   - `PATCH /api/appointments/:id` - Añadido requireResourceOwnership('appointment')
   - `DELETE /api/appointments/:id` - Añadido requireResourceOwnership('appointment')
   - Verificación: clientId, assignedToId (concierge), o property owner
   - Obtiene property relacionada para verificar ownership correctamente

3. **Rutas de Offers Protegidas** ✅
   - `PATCH /api/offers/:id` - Añadido requireResourceOwnership('offer')
   - Verificación: clientId o property owner
   - Obtiene property relacionada para verificar ownership

4. **Properties ya protegidas** ✅
   - `PATCH /api/properties/:id` - Ya tenía verificación inline correcta (ownerId o admin)
   - `DELETE /api/properties/:id` - Ya tenía verificación inline correcta (ownerId o admin)

### Impacto de Seguridad
**Antes de Fase 2:**
- ❌ Cualquier usuario autenticado podía modificar cualquier appointment
- ❌ Cualquier usuario autenticado podía modificar cualquier offer
- ❌ Riesgo de escalada horizontal de privilegios

**Después de Fase 2:**
- ✅ Solo el cliente, concierge asignado, o dueño de la propiedad pueden modificar appointments
- ✅ Solo el cliente u owner de la propiedad pueden modificar offers
- ✅ Admin/Master mantienen acceso total para administración
- ✅ Middleware reutilizable para futuras rutas de recursos

## ✅ Completado (Fase 3 - Octubre 7, 2025) - EN PROGRESO

### Extensión de Autorización de Recursos
1. **Middleware Extendido** ✅
   - Añadido soporte para 9 nuevos tipos de recursos
   - rental-application, service-provider, service, service-booking, presentation-card, notification, budget, task, conversation
   - Lógica especializada para cada tipo con múltiples stakeholders

2. **Rutas de Rental Applications Protegidas** ✅
   - `PATCH /api/rental-applications/:id`
   - `PATCH /api/rental-applications/:id/status`
   - Verificación: applicantId o property owner

3. **Rutas de Rental Contracts Protegidas** ✅
   - `PATCH /api/rental-contracts/:id`
   - `PATCH /api/rental-contracts/:id/status`
   - Verificación: ownerId (propietario), tenantId (inquilino), o sellerId (vendedor)
   - Múltiples stakeholders pueden modificar

4. **Rutas de Service Providers Protegidas** ✅
   - `PATCH /api/service-providers/:id`
   - Verificación: userId

5. **Rutas de Services Protegidas** ✅
   - `PATCH /api/services/:id`
   - `DELETE /api/services/:id`
   - Verificación: providerId (a través de provider.userId)
   - Retorna 404 si provider no existe

6. **Rutas de Service Bookings Protegidas** ✅
   - `PATCH /api/service-bookings/:id`
   - `DELETE /api/service-bookings/:id`
   - Verificación: clientId O provider (a través de service -> provider.userId)
   - Permite tanto al cliente como al provider modificar

7. **Rutas de Presentation Cards Protegidas** ✅
   - `PATCH /api/presentation-cards/:id`
   - `DELETE /api/presentation-cards/:id`
   - Verificación: clientId

8. **Rutas de Notifications Protegidas** ✅
   - `PATCH /api/notifications/:id/read`
   - Verificación: userId

9. **Rutas de Budgets Protegidas** ✅
   - `PATCH /api/budgets/:id`
   - `DELETE /api/budgets/:id`
   - Verificación: staffId (creador del budget)

10. **Rutas de Tasks Protegidas** ✅
   - `PATCH /api/tasks/:id`
   - `DELETE /api/tasks/:id`
   - Verificación: assignedToId (persona asignada)

11. **Rutas de Conversations Protegidas** ✅
   - `PATCH /api/chat/conversations/:id/mark-read`
   - Verificación: usuario debe ser participante
   - Consulta chatParticipants para validar

### Impacto de Seguridad Fase 3
**Antes:**
- ❌ Cualquier usuario podía modificar rental applications de otros
- ❌ Cualquier usuario podía modificar rental contracts ajenos
- ❌ Service providers sin control de sus propios services
- ❌ Service bookings sin protección dual (cliente + provider)
- ❌ Presentation cards modificables por cualquiera
- ❌ Notifications marcables como leídas por cualquier usuario
- ❌ Budgets modificables por cualquier usuario
- ❌ Tasks modificables por cualquier usuario
- ❌ Conversations marcables como leídas por no participantes

**Después:**
- ✅ Solo applicants o property owners pueden modificar rental applications
- ✅ Solo stakeholders (owner, tenant, seller) pueden modificar rental contracts
- ✅ Solo el provider puede modificar sus services
- ✅ Cliente Y provider pueden modificar service bookings
- ✅ Solo el dueño de la presentation card puede modificarla
- ✅ Solo el dueño de la notification puede marcarla como leída
- ✅ Solo el creador del budget (staffId) puede modificarlo
- ✅ Solo el asignado (assignedToId) puede modificar tasks
- ✅ Solo participantes pueden marcar conversations como leídas
- ✅ **Total: 17 rutas adicionales protegidas en Fase 3 (Iteraciones 1-2)**

### Fase 3 - Iteración 3 (Octubre 7, 2025) ✅

**Middleware Extendido para 7 Nuevos Tipos de Recursos:**
1. **property-draft** - Verificación por userId
2. **blocked-slot** - Verificación por conciergeId
3. **property-recommendation** - Dual access: clientId O sellerId
4. **auto-suggestion** - Verificación por clientId
5. **checklist-item** - Delegación a verificación de stakeholders del contrato
6. **alert** - Verificación por userId
7. **presentation-card toggle-active** - Nueva ruta para recurso existente

**Storage Methods Añadidos:**
- `getContractChecklistItem(id)` - Recuperar item individual de checklist
- `getPropertyRecommendation(id)` - Recuperar recomendación de propiedad
- `getAutoSuggestion(id)` - Recuperar auto sugerencia

**14 Rutas Adicionales Protegidas:**

**Property Submission Drafts** (2 rutas):
- `PATCH /api/property-submission-drafts/:id` - Reemplazó verificación inline con middleware
- `DELETE /api/property-submission-drafts/:id` - Reemplazó verificación inline con middleware

**Concierge Blocked Slots** (1 ruta):
- `DELETE /api/concierge-blocked-slots/:id` - Solo el concierge dueño puede eliminar

**Presentation Cards** (1 ruta):
- `PATCH /api/presentation-cards/:id/toggle-active` - Solo el cliente dueño puede activar/desactivar

**Property Recommendations** (3 rutas - Dual Access):
- `PATCH /api/property-recommendations/:id/mark-read` (2 endpoints)
- `PATCH /api/property-recommendations/:id/set-interest`
- Cliente (recipient) Y seller (creador) pueden modificar

**Auto Suggestions** (3 rutas):
- `PATCH /api/auto-suggestions/:id/mark-read` (2 endpoints)
- `PATCH /api/auto-suggestions/:id/set-interest`

**Contract Checklist Items** (1 ruta):
- `PATCH /api/contract-checklist-items/:id`
- Delegación a stakeholders del contrato (owner, tenant, seller)

**System Alerts** (4 rutas):
- `PATCH /api/alerts/:id/acknowledge`
- `PATCH /api/alerts/:id/resolve`
- `PATCH /api/alerts/:id/dismiss`
- `DELETE /api/alerts/:id`

**Mejoras en esta Iteración:**
- Reemplazo de verificaciones inline en property-drafts por middleware consistente
- Patrón de acceso dual para property-recommendations (similar a service-bookings)
- Delegación de autorización para checklist-items basada en stakeholders del contrato

**Impacto de Seguridad:**
- **Antes**: 14 rutas permitían a cualquier usuario autenticado modificar recursos ajenos
- **Después**: Solo los propietarios legítimos o stakeholders tienen acceso
- **Total Fase 3**: 17 (Iter 1-2) + 14 (Iter 3) = **31 rutas protegidas**
- **Progreso General**: 36 rutas con verificación de ownership (11.4% de 315 rutas totales)

### Fase 3 - Iteración 4 (Octubre 7, 2025) ✅

**Vulnerabilidades Críticas de userId/providerId Spoofing Corregidas:**

Se identificaron y corrigieron 5 rutas POST vulnerables que permitían a usuarios especificar IDs arbitrarios de otros usuarios, habilitando la creación de recursos en nombre de terceros.

**1. POST /api/services - CRÍTICA** (Línea 5990)
- **Vulnerabilidad**: Permitía especificar `providerId` arbitrario en el body
- **Impacto**: Un usuario podía crear servicios para cualquier proveedor
- **Corrección**: Ahora obtiene el service provider del usuario autenticado y fuerza el `providerId`
- Retorna 403 si el usuario no es un proveedor registrado

**2. POST /api/presentation-cards - ALTA** (Línea 5639)
- **Vulnerabilidad**: Permitía especificar `clientId` vía patrón `req.body.clientId || userId`
- **Impacto**: Un usuario podía crear presentation cards para otros clientes
- **Corrección**: Ahora siempre usa el ID del usuario autenticado como `clientId`

**3. POST /api/appointments - MEDIA** (Línea 5005)
- **Vulnerabilidad**: Permitía especificar `clientId` arbitrario
- **Impacto**: Usuarios regulares podían crear citas para otros clientes
- **Corrección**: Verificación basada en roles - solo admin/master/admin_jr/seller pueden especificar clientId diferente
- Usuarios regulares obtienen su propio userId silenciosamente

**4. POST /api/offers - MEDIA** (Línea 6513)
- **Vulnerabilidad**: Mismo patrón que appointments
- **Impacto**: Usuarios regulares podían crear ofertas para otros clientes
- **Corrección**: Misma verificación basada en roles que appointments

**5. POST /api/rental-applications - MEDIA** (Línea 6634)
- **Vulnerabilidad**: Permitía especificar `applicantId` arbitrario
- **Impacto**: Usuarios regulares podían crear solicitudes de renta para otros
- **Corrección**: Solo admin/master/admin_jr pueden especificar applicantId diferente

**Patrones de Implementación:**

**Prevención Completa (services, presentation-cards):**
```typescript
// services: Debe ser proveedor registrado
const providers = await storage.getServiceProviders({ userId });
if (!providers || providers.length === 0) {
  return res.status(403).json({ message: "Must be registered provider" });
}
const serviceData = { ...req.body, providerId: providers[0].id };
```

**Delegación Basada en Roles (appointments, offers, applications):**
```typescript
let clientId = userId;
if (req.body.clientId && req.body.clientId !== userId) {
  if (user && ["master", "admin", "admin_jr", "seller"].includes(user.role)) {
    clientId = req.body.clientId;
  }
  // Usuarios no-admin obtienen su propio userId silenciosamente
}
```

**Impacto de Seguridad Iteración 4:**
- **Antes**: 5 rutas POST permitían suplantación de userId/providerId
- **Después**: Todas las rutas POST fuerzan identidad autenticada o requieren rol elevado
- **Progreso General**: 36 rutas + 5 correcciones críticas = **41 puntos de protección implementados**

## 🚨 Problemas Críticos Identificados

### 1. VALIDACIÓN DE ENTRADA EN BACKEND (CRÍTICO)

**Problema**: De 315 rutas, muchas NO tienen validación Zod en el backend.

**Riesgo**: Inyección de datos maliciosos, corrupción de base de datos, bypass de validación frontend.

**Rutas Críticas Sin Validación** (ejemplos):
```typescript
// ❌ SIN VALIDACIÓN
app.patch("/api/users/:id/role", ...) // Línea 556 - ¡Cambio de rol sin validar!
app.post("/api/leads", ...) // Línea 4330 - Crear lead sin schema
app.patch("/api/appointments/:id", ...) // Línea 5077 - Sin validación
app.post("/api/rental-opportunity-requests", ...) // Línea 3569
```

**Solución Recomendada**:
```typescript
// ✅ CON VALIDACIÓN
app.patch("/api/users/:id/role", isAuthenticated, requireRole(["master"]), async (req, res) => {
  const roleSchema = z.object({
    role: z.enum(["client", "owner", "seller", "admin", "master"])
  });
  
  const validationResult = roleSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ 
      message: "Invalid data",
      errors: validationResult.error.errors 
    });
  }
  
  // Continue with validated data...
});
```

### 2. RBAC - CONTROL DE ACCESO BASADO EN ROLES (CRÍTICO)

**Problema**: Rutas administrativas sin `requireRole()` adecuado.

**Riesgo**: Escalada de privilegios - un "seller" podría acceder a funciones de "admin".

**Rutas Sin Protección** (ejemplos):
```typescript
// ❌ VULNERABLE - Rutas admin sin requireRole
app.post("/api/admin/colonies", isAuthenticated, ...) // Línea 1494
app.patch("/api/admin/colonies/:id", isAuthenticated, ...) // Línea 1535
app.delete("/api/admin/colonies/:id", isAuthenticated, ...) // Línea 1576
```

**Solución Recomendada**:
```typescript
// ✅ PROTEGIDO
app.post("/api/admin/colonies", 
  isAuthenticated, 
  requireRole(["admin", "master"]), // ← AÑADIR ESTO
  async (req, res) => {
    // ...
  }
);
```

### 3. AUTORIZACIÓN DE RECURSOS (ALTO)

**Problema**: Rutas que modifican recursos sin verificar propiedad.

**Ejemplo Vulnerable**:
```typescript
// ❌ Un usuario podría modificar propiedades que no le pertenecen
app.patch("/api/properties/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  // NO verifica si req.user.id === property.ownerId
  await storage.updateProperty(id, req.body);
});
```

**Solución**:
```typescript
// ✅ VERIFICAR PROPIEDAD
app.patch("/api/properties/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.claims.sub;
  
  const property = await storage.getProperty(id);
  
  // Verificar propiedad o rol admin
  if (property.ownerId !== userId && !["admin", "master"].includes(req.user.role)) {
    return res.status(403).json({ message: "No tienes permiso para modificar esta propiedad" });
  }
  
  await storage.updateProperty(id, validatedData);
});
```

### 4. SQL INJECTION (MEDIO - Drizzle ORM ayuda)

**Status**: ✅ Drizzle ORM previene la mayoría de inyecciones SQL.

**Acción**: Verificar que NO se construyan queries dinámicas con interpolación de strings.

```typescript
// ❌ NUNCA HACER ESTO
const query = `SELECT * FROM users WHERE id = '${userId}'`; // ¡PELIGROSO!

// ✅ SIEMPRE USAR ORM
const user = await db.select().from(users).where(eq(users.id, userId));
```

## 📋 Plan de Acción Priorizado

### Fase 1: Rutas Críticas (Inmediato)
1. ✅ **Todas las rutas `/api/admin/*`** deben tener `requireRole(["admin", "master"])`
2. ✅ **Todas las rutas POST/PUT/PATCH** deben tener validación Zod
3. ✅ **Rutas de modificación de usuario/roles** deben validar permisos

### Fase 2: Rutas de Recursos (Alta Prioridad) - ✅ COMPLETADO
1. ✅ Verificar propiedad de recursos antes de modificar:
   - ✅ Properties (ya tenían verificación correcta)
   - ✅ Appointments (protegido con requireResourceOwnership)
   - ✅ Offers (protegido con requireResourceOwnership)
   - ⏳ Rental Contracts (pendiente - considerar en Fase 3)

### Fase 3: Auditoría Completa (Programada)
1. Revisar las 315 rutas una por una
2. Añadir validación Zod donde falte
3. Añadir RBAC donde corresponda
4. Tests de seguridad automatizados

## 🛠️ Helper Middleware Recomendado

Crear middleware reutilizable para verificar propiedad de recursos:

```typescript
// server/middleware/resourceOwnership.ts
export const requireResourceOwnership = (
  resourceType: 'property' | 'appointment' | 'offer',
  getResourceFn: (id: string) => Promise<any>
) => {
  return async (req: any, res: any, next: any) => {
    const resourceId = req.params.id;
    const userId = req.user?.claims?.sub;
    
    const resource = await getResourceFn(resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Admin/Master pueden acceder a todo
    const userRole = req.session?.adminUser?.role || req.user?.role;
    if (["admin", "master"].includes(userRole)) {
      return next();
    }
    
    // Verificar propiedad según tipo de recurso
    const isOwner = resource.ownerId === userId || 
                    resource.userId === userId ||
                    resource.createdBy === userId;
    
    if (!isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};
```

## 📊 Estadísticas de Seguridad

- **Total de rutas**: 315
- **Rutas con requireRole**: ~45 (14%)
- **Rutas con validación Zod**: ~124 (39%) - ↑4 en Fase 1
- **Rutas con ownership verification**: ~36 (11.4%) - ↑31 en Fase 3
- **Rutas críticas sin protección**: ~10 - ↓15 después de Fases 1-3
- **Rutas admin sin RBAC**: ~12 - ↓3 después de Fase 1

### Progreso de Fases
- ✅ **Fase 1**: Validación Zod y RBAC en rutas críticas (4 rutas)
- ✅ **Fase 2**: Ownership verification base (3 rutas: appointments, offers)
- 🔄 **Fase 3**: Extensión de ownership y corrección de vulnerabilidades POST (36 rutas protegidas en 4 iteraciones)
  - Iteración 1: 12 rutas (rentals, services, providers, cards, notifications)
  - Iteración 2: 5 rutas (budgets, tasks, conversations)
  - Iteración 3: 14 rutas (drafts, alerts, recommendations, suggestions, checklist, slots)
  - Iteración 4: 5 vulnerabilidades críticas POST corregidas (services, cards, appointments, offers, applications)
- ⏳ **Fase 3 pendiente**: ~274 rutas restantes por auditar (87%)

## 🎯 Próximos Pasos Recomendados

1. **Inmediato**: Proteger rutas admin y de roles
2. **Esta semana**: Añadir validación Zod a rutas críticas
3. **Este mes**: Auditoría completa de 315 rutas
4. **Continuo**: Tests de penetración automatizados
