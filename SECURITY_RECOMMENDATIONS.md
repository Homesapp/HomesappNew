# 🔐 Recomendaciones de Seguridad para HomesApp

## ✅ Completado
- **Logo HomesApp**: Tamaño estandarizado entre páginas (h-12 md:h-16)

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

### Fase 2: Rutas de Recursos (Alta Prioridad)
1. Verificar propiedad de recursos antes de modificar:
   - Properties
   - Appointments
   - Offers
   - Rental Contracts

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
- **Rutas con validación Zod**: ~120 (38%)
- **Rutas críticas sin protección**: ~25
- **Rutas admin sin RBAC**: ~15

## 🎯 Próximos Pasos Recomendados

1. **Inmediato**: Proteger rutas admin y de roles
2. **Esta semana**: Añadir validación Zod a rutas críticas
3. **Este mes**: Auditoría completa de 315 rutas
4. **Continuo**: Tests de penetración automatizados
