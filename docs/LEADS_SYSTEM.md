# Sistema Unificado de Leads - HomesApp

## Visión General

El sistema de leads unificado centraliza la gestión de todos los tipos de prospectos:
- **Clientes**: Personas buscando rentar o comprar una propiedad
- **Propietarios**: Dueños de propiedades que quieren listar con la agencia
- **Vendedores**: Agentes que aplican para trabajar con la agencia

## Arquitectura de Datos

### Tabla Principal: `external_leads`

Utilizamos `external_leads` como tabla central porque:
1. Ya tiene un pipeline de estados completo
2. Soporta multi-tenancy por agencia
3. Tiene campos para seguimiento de actividad

#### Estados del Pipeline (Lead Status)

```
nuevo_lead → cita_coordinada → interesado → oferta_enviada → oferta_completada 
→ formato_enviado → formato_completado → proceso_renta → renta_concretada

Estados finales alternativos: perdido, muerto
```

#### Tipos de Lead (leadType)

| Tipo | Descripción | Pipeline Específico |
|------|-------------|---------------------|
| `cliente` | Busca propiedad | Full pipeline hasta renta_concretada |
| `propietario` | Ofrece propiedad | nuevo_lead → interesado → formato_completado → activo |
| `vendedor` | Aplica como agente | nuevo_lead → interesado → formato_completado → aprobado |

#### Fuentes de Leads (source)

| Fuente | Descripción |
|--------|-------------|
| `chatbot` | Chatbot flotante del sitio |
| `mapa` | Desde el mapa interactivo |
| `listado` | Desde una ficha de propiedad |
| `formulario_propietario` | Formulario de onboarding propietario |
| `formulario_vendedor` | Formulario de aplicación vendedor |
| `link_compartido` | Link de oferta/formato compartido |
| `whatsapp_manual` | Registrado manualmente desde WhatsApp |
| `referido` | Referido por otro cliente/agente |
| `email_import` | Importado desde email (Tokko, EasyBroker) |

## Vistas por Rol

### 1. Vista del Vendedor (Seller CRM)

**Ruta**: `/mis-leads`

Funcionalidades:
- Vista Kanban con drag-and-drop por estado
- Vista de lista filtrable
- Filtros: estado, tipo de operación, propiedad, fecha
- Acciones rápidas: cambiar estado, agendar cita, agregar nota
- Detalle de lead con historial de actividad

### 2. Vista del Admin (Global Inbox)

**Ruta**: `/admin/leads`

Funcionalidades:
- Tabla global con todos los leads del sistema
- Métricas: leads nuevos hoy, sin contacto >X horas, por etapa, por vendedor
- Filtros: tipo, estado, vendedor, fuente, fecha
- Acciones: asignar/reasignar, aprobar, marcar como cerrado
- Timeline completo de auditoría

### 3. Vista del Cliente (Mis Solicitudes)

**Ruta**: `/mis-solicitudes`

Funcionalidades:
- Lista de solicitudes agrupadas por propiedad
- Pipeline visual del proceso
- Estado actual y siguiente paso
- Acceso directo al Portal si tiene contrato activo
- Mensajes claros de "qué falta"

## Formularios de Ingreso

### Formulario Unificado de Cliente

Campos mínimos:
- Nombre completo
- WhatsApp (obligatorio)
- Presupuesto
- Zona deseada
- Fecha estimada de ingreso
- Tipo de operación (renta 12m, renta 6m, corta, compra)

Puntos de entrada:
1. Chatbot (FloatingChat)
2. Mapa interactivo
3. Ficha de propiedad
4. Formulario público

### Formulario de Propietario

Wizard de onboarding:
1. Datos personales
2. Datos de la propiedad
3. Expectativas de precio
4. Documentos iniciales

### Formulario de Vendedor

Wizard de aplicación:
1. Datos personales
2. Experiencia profesional
3. Motivación
4. Documentos

## Flujo de Datos

```
Entrada → Validación → Deduplicación → Creación/Actualización → Notificación
```

### Deduplicación

- Normalización de teléfono (últimos 10 dígitos)
- Comparación de nombre normalizado
- Ventana de tiempo para leads duplicados

## API Endpoints

### Intake (Público)

```
POST /api/lead-intake
Body: { type, source, ...leadData }
Response: { success, leadId, message, nextSteps }
```

### Gestión (Autenticado)

```
GET /api/unified-leads?type=&status=&assignedTo=&source=&page=&limit=
POST /api/unified-leads
PATCH /api/unified-leads/:id
PATCH /api/unified-leads/:id/status
POST /api/unified-leads/:id/assign
GET /api/unified-leads/:id/timeline
POST /api/unified-leads/:id/activity
```

### Métricas (Admin)

```
GET /api/unified-leads/metrics
Response: {
  newToday: number,
  noContact: number,
  byStage: { [stage]: count },
  bySeller: { [sellerId]: count },
  conversionRate: number
}
```

## Componentes Compartidos

### LeadPipelineStepper

Visualización del pipeline con estados y progreso.

### LeadCard

Tarjeta de lead para Kanban y listas.

### LeadDetailDialog

Diálogo con información completa, historial y acciones.

### LeadFilters

Componente de filtros reutilizable.

### LeadMetricCards

Tarjetas de métricas para dashboards.

## Transición de Datos

1. **Fase 1**: Agregar campo `leadType` a `external_leads`
2. **Fase 2**: Migrar datos existentes de `leads` a `external_leads`
3. **Fase 3**: Deprecar tabla `leads` interna
4. **Fase 4**: Eliminar código legacy

## Seguridad

- Validación de permisos por agencia
- Rate limiting en endpoints públicos
- Sanitización de datos de entrada
- Auditoría de cambios

## Métricas y KPIs

| Métrica | Descripción | Meta |
|---------|-------------|------|
| Tiempo de primer contacto | Desde creación hasta primer contacto | < 1 hora |
| Tasa de conversión | Leads que llegan a renta_concretada | > 15% |
| Leads por vendedor | Balance de carga | Equitativo |
| Leads sin actividad | Leads estancados > 48h | < 10% |
