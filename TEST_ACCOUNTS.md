# Cuentas de Prueba - HomesApp

Este documento contiene las credenciales de las cuentas de prueba para cada rol en la plataforma HomesApp.

## 🔐 Acceso a la Plataforma

**URL de la aplicación:** Usa el enlace del webview de Replit o el dominio .replit.app

## 👤 Roles y Cuentas de Prueba

### 1. Admin / Master (Administrador)
**Usuario ID Replit:** `48288015` (ya configurado con rol `master`)
- **Rol:** Master Administrator
- **Permisos:** Acceso completo a todas las funcionalidades
- **Funcionalidades:**
  - Gestión de usuarios y roles
  - Aprobación de propiedades
  - Gestión de colonias y condominios
  - Administración de leads y citas
  - Panel de auditoría
  - Configuración del sistema

### 2. Cliente (Client)
**Usuario ID Replit:** Cualquier usuario nuevo que se registre por defecto tendrá rol `client`
- **Rol:** Client
- **Funcionalidades:**
  - Búsqueda de propiedades
  - Crear tarjetas de presentación (máx 3)
  - Agendar citas para visitas
  - Gestionar favoritos
  - Dejar reviews de propiedades, citas y conserjes
  - Chat con propietarios y conserjes
  - Ver oportunidades de inversión

### 3. Propietario (Owner)
**Cómo crear:** Solicitar cambio de rol desde el perfil de usuario o que un admin lo asigne
- **Rol:** Owner
- **Funcionalidades:**
  - Publicar propiedades (requiere aprobación de admin)
  - Gestionar solicitudes de cambio de propiedades
  - Configurar auto-aprobación de citas
  - Gestionar staff de propiedades
  - Ver reportes de inspección
  - Firmar acuerdos digitales
  - Sistema de referidos de propietarios

### 4. Conserje (Concierge)
**Cómo crear:** Un admin debe asignar el rol `concierge` a un usuario
- **Rol:** Concierge
- **Funcionalidades:**
  - Ver y atender citas asignadas
  - Dejar reviews de clientes después de las citas
  - Reportar estado de visitas
  - Chat con clientes
  - Gestión de citas pendientes

**Nota:** Para probar el rol de conserje, solicita al administrador que asigne el rol a tu cuenta.

### 5. Vendedor (Seller)
**Cómo crear:** Un admin debe asignar el rol `seller` a un usuario
- **Rol:** Seller
- **Funcionalidades:**
  - Gestión de leads
  - Conversión de leads a clientes
  - Seguimiento de oportunidades
  - Ver dashboard de ventas
  - Chat con leads y clientes

## 📋 Sistema de Reviews Implementado

### Reviews de Clientes hacia:
1. **Propiedades:** Los clientes pueden calificar propiedades que han visitado (1-5 estrellas + comentarios)
2. **Citas:** Los clientes pueden calificar la experiencia de una cita (1-5 estrellas + comentarios)
3. **Conserjes:** Los clientes pueden calificar el servicio del conserje que los atendió (1-5 estrellas + comentarios)

### Reviews de Conserjes hacia:
1. **Clientes:** Los conserjes pueden dejar feedback sobre los clientes que atendieron (1-5 estrellas + comentarios)

### Endpoints de API para Reviews:
- `GET/POST /api/reviews/properties` - Reviews de propiedades
- `GET/POST /api/reviews/appointments` - Reviews de citas
- `GET/POST /api/reviews/concierges` - Reviews de conserjes
- `GET/POST /api/reviews/clients` - Reviews de clientes (solo conserjes)

## 🔄 Cambios Realizados en Navegación

Se eliminó el prefijo "Mis" de los siguientes elementos de navegación:
- ~~"Mis Citas"~~ → **"Citas"**
- ~~"Mis Favoritos"~~ → **"Favoritos"**
- ~~"Mis Oportunidades"~~ → **"Oportunidades"**

Estos cambios aplican tanto en español como en inglés (Appointments, Favorites, Opportunities).

## 🐛 Problemas Conocidos

1. **Toggle de idioma en perfil de cliente:** El cambio de idioma español/inglés funciona correctamente en el menú del propietario pero necesita verificación en el perfil del cliente.

## 🚀 Próximas Funcionalidades Sugeridas

1. **Dashboard para Conserje:** Crear una vista específica para conserjes con:
   - Lista de citas asignadas del día
   - Historial de citas completadas
   - Estadísticas de reviews recibidos
   - Reportes rápidos de visitas

2. **UI de Reviews:** Agregar componentes visuales para:
   - Formulario de review después de completar una cita
   - Vista de reviews en el perfil de propiedades
   - Vista de reviews en el perfil de conserje
   - Badge de calificación promedio

3. **Notificaciones:** Implementar notificaciones push cuando:
   - Un cliente deja un review de un conserje
   - Un conserje deja un review de un cliente
   - Una cita es confirmada o modificada

## 📞 Soporte

Para cambios de rol o problemas con las cuentas, contacta al administrador de la plataforma.

---

**Última actualización:** Octubre 2025
**Versión:** 1.0
