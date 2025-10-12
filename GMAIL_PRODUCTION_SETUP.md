# Configuración de Gmail para Producción

## Problema Identificado
El envío de correos de restablecimiento de contraseña falla en producción debido a:
1. Falta de variables de entorno específicas de producción (`WEB_REPL_RENEWAL`)
2. URL incorrecta en los enlaces de reset (usaba variable de desarrollo)

## Soluciones Implementadas

### 1. Mejora del Logging
Se agregó logging detallado en `server/gmail.ts` para diagnosticar problemas:
- Verifica variables de entorno necesarias
- Muestra errores claros cuando faltan configuraciones
- Registra el proceso de obtención de tokens de acceso

### 2. Corrección de URLs
Se actualizó `server/routes.ts` para usar la URL correcta en producción:
- **Producción**: Usa `REPLIT_DOMAINS` (primer dominio de la lista)
- **Desarrollo**: Usa `REPLIT_DEV_DOMAIN`
- **Local**: Usa `http://localhost:5000`

## Configuración Requerida en Producción

### Variables de Entorno Automáticas (Replit)
Estas variables son configuradas automáticamente por Replit:
- ✅ `REPL_IDENTITY` - Disponible en desarrollo
- ⚠️ `WEB_REPL_RENEWAL` - Debe estar disponible en deployment/producción
- ✅ `REPLIT_CONNECTORS_HOSTNAME` - Requerida para conectores
- ✅ `REPLIT_DOMAINS` - Lista de dominios del deployment

### Verificación de la Integración de Gmail

#### Opción 1: Desde la UI de Admin
1. Accede a `/admin/integrations` como usuario admin
2. Verifica que Gmail muestre estado "Conectado"
3. Si aparece "Desconectado", haz clic en "Configure Integration"
4. Sigue el proceso de autenticación OAuth con Google

#### Opción 2: Verificación Manual en Replit
1. Ve a la pestaña "Secrets" o "Environment variables" en Replit
2. Verifica que exista la conexión a Google Mail
3. Si no existe, configúrala desde la pestaña de Integraciones

### Logs para Diagnóstico

Cuando un usuario reporta que no recibe el correo, revisa los logs del servidor:

```bash
# Buscar en logs por errores de Gmail
grep "Gmail" /path/to/logs

# Errores específicos a buscar:
# "Gmail config error: REPLIT_CONNECTORS_HOSTNAME not found"
# "Gmail config error: Neither REPL_IDENTITY nor WEB_REPL_RENEWAL found"  
# "Gmail not connected - no connection found in Replit"
# "Gmail connector API failed"
```

### Solución de Problemas Comunes

#### Error: "WEB_REPL_RENEWAL not found"
**Causa**: La aplicación está en producción pero falta la variable de autenticación.
**Solución**: Verificar que el deployment tenga acceso a las variables de entorno de Replit.

#### Error: "Gmail not connected"
**Causa**: La integración de Gmail no está configurada o el token expiró.
**Solución**: 
1. Ve a `/admin/integrations`
2. Reconecta Gmail usando el botón "Manage" o "Configure Integration"

#### Error: "No access token available"
**Causa**: La estructura de respuesta del conector cambió o el token no se obtuvo correctamente.
**Solución**: Revisar los logs detallados que ahora se imprimen con la estructura completa.

## Flujo de Envío de Correo de Restablecimiento

1. Usuario solicita reset en `/api/password-reset/request`
2. Sistema genera token único (válido por 1 hora)
3. Sistema construye URL de reset basada en el entorno:
   - Producción: `https://[primer-dominio]/reset-password?token=...`
   - Desarrollo: `https://[dev-domain]/reset-password?token=...`
4. Sistema intenta obtener cliente Gmail:
   - Busca `WEB_REPL_RENEWAL` (producción) o `REPL_IDENTITY` (dev)
   - Consulta API de conectores de Replit
   - Obtiene access token de OAuth
5. Envía correo usando Gmail API
6. Registra éxito/error en logs

## Testing en Producción

Para verificar que el correo funciona:

1. **Crear usuario de prueba** con email real
2. **Solicitar reset** desde la página de login
3. **Revisar logs del servidor** para confirmar:
   ```
   Generated password reset link for [email] using baseUrl: https://...
   Password reset email sent successfully to [email]
   ```
4. **Verificar recepción** del correo (revisar spam también)

## Monitoreo Recomendado

- Configurar alertas cuando falle el envío de emails
- Revisar periódicamente `/admin/integrations` para verificar estado
- Monitorear logs de producción para errores de Gmail
- Verificar que los tokens de OAuth no expiren

## Notas Adicionales

- El sistema **no revela** si un email existe o no (prevención de enumeración de usuarios)
- Los errores de envío se registran pero la respuesta siempre es genérica
- Los tokens de reset expiran en 1 hora por seguridad
- Los tokens solo pueden usarse una vez
