import { Express } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";

export function registerPortalRoutes(
  app: Express,
  handleGenericError: (res: any, error: any) => void,
  isAuthenticated: any,
  requireRole: any,
  EXTERNAL_ADMIN_ROLES: string[],
  getUserAgencyId: (req: any) => Promise<string | null>,
  createAuditLog: (req: any, action: string, entity: string, entityId: string, details: string) => Promise<void>
) {
  // POST /api/portal/auth/login - Public endpoint for tenant/owner login
  app.post("/api/portal/auth/login", async (req: any, res) => {
    try {
      const { accessCode, password } = req.body;

      if (!accessCode || !password) {
        return res.status(400).json({ 
          message: "Access code and password are required",
          message_es: "Código de acceso y contraseña son requeridos"
        });
      }

      const token = await storage.getExternalPortalAccessTokenByCode(accessCode);
      
      if (!token) {
        return res.status(401).json({ 
          message: "Invalid access code or password",
          message_es: "Código de acceso o contraseña inválidos"
        });
      }

      if (token.expiresAt && new Date() > token.expiresAt) {
        return res.status(401).json({ 
          message: "Access code has expired",
          message_es: "El código de acceso ha expirado"
        });
      }

      const passwordValid = await bcrypt.compare(password, token.hashedSecret);
      if (!passwordValid) {
        return res.status(401).json({ 
          message: "Invalid access code or password",
          message_es: "Código de acceso o contraseña inválidos"
        });
      }

      const contract = await storage.getExternalRentalContract(token.contractId);
      if (!contract || contract.status !== 'active') {
        return res.status(403).json({ 
          message: "This portal is only available for active rental contracts",
          message_es: "Este portal solo está disponible para contratos de renta activos"
        });
      }

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await storage.createExternalPortalSession({
        accessTokenId: token.id,
        sessionToken,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      });

      await storage.incrementPortalTokenUsage(token.id);
      const agency = await storage.getExternalAgency(token.agencyId);

      res.json({
        sessionToken,
        expiresAt,
        role: token.role,
        contractId: token.contractId,
        agencyName: agency?.name || 'Unknown Agency',
        message: token.role === 'tenant' ? "Welcome to your tenant portal" : "Welcome to your owner portal",
        message_es: token.role === 'tenant' ? "Bienvenido a tu portal de inquilino" : "Bienvenido a tu portal de propietario"
      });
    } catch (error: any) {
      console.error("Portal login error:", error);
      handleGenericError(res, error);
    }
  });

  const verifyPortalSession = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication required", message_es: "Autenticación requerida" });
    }

    const sessionToken = authHeader.substring(7);
    
    try {
      const session = await storage.getExternalPortalSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session", message_es: "Sesión inválida o expirada" });
      }

      const accessToken = await storage.getExternalPortalAccessToken(session.accessTokenId);
      if (!accessToken || accessToken.status !== 'active') {
        return res.status(401).json({ message: "Access has been revoked", message_es: "El acceso ha sido revocado" });
      }

      const contract = await storage.getExternalRentalContract(accessToken.contractId);
      if (!contract || contract.status !== 'active') {
        return res.status(403).json({ message: "Portal access requires an active rental contract", message_es: "El acceso al portal requiere un contrato de renta activo" });
      }

      await storage.updatePortalSessionActivity(session.id);
      req.portalSession = session;
      req.portalToken = accessToken;
      req.portalContract = contract;
      req.portalRole = accessToken.role;
      req.portalAgencyId = accessToken.agencyId;
      next();
    } catch (error: any) {
      console.error("Portal session verification error:", error);
      return res.status(500).json({ message: "Authentication error", message_es: "Error de autenticación" });
    }
  };

  app.post("/api/portal/auth/logout", verifyPortalSession, async (req: any, res) => {
    try {
      await storage.revokeExternalPortalSession(req.portalSession.id);
      res.json({ message: "Logged out successfully", message_es: "Sesión cerrada exitosamente" });
    } catch (error: any) {
      console.error("Portal logout error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/auth/verify", verifyPortalSession, async (req: any, res) => {
    try {
      const agency = await storage.getExternalAgency(req.portalAgencyId);
      const property = req.portalContract.propertyId ? await storage.getExternalProperty(req.portalContract.propertyId) : null;
      const unit = req.portalContract.unitId ? await storage.getExternalUnit(req.portalContract.unitId) : null;

      res.json({
        role: req.portalRole,
        contractId: req.portalContract.id,
        agencyName: agency?.name || 'Unknown Agency',
        propertyAddress: property?.address || unit?.name || 'Unknown Property',
        contractStartDate: req.portalContract.startDate,
        contractEndDate: req.portalContract.endDate,
        monthlyRent: req.portalContract.monthlyRent,
        tenantName: req.portalContract.tenantName,
        ownerName: req.portalContract.ownerName,
      });
    } catch (error: any) {
      console.error("Portal verify error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/contract", verifyPortalSession, async (req: any, res) => {
    try {
      const contract = req.portalContract;
      const agency = await storage.getExternalAgency(req.portalAgencyId);
      let propertyInfo = null;
      
      if (contract.propertyId) {
        const property = await storage.getExternalProperty(contract.propertyId);
        propertyInfo = property ? { address: property.address, type: property.propertyType } : null;
      } else if (contract.unitId) {
        const unit = await storage.getExternalUnit(contract.unitId);
        propertyInfo = unit ? { address: unit.name, type: 'unit' } : null;
      }

      res.json({
        id: contract.id,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        depositAmount: contract.depositAmount,
        paymentDueDay: contract.paymentDueDay,
        paymentMethod: contract.paymentMethod,
        tenantName: contract.tenantName,
        tenantEmail: contract.tenantEmail,
        tenantPhone: contract.tenantPhone,
        ownerName: contract.ownerName,
        property: propertyInfo,
        agencyName: agency?.name,
        agencyPhone: agency?.phone,
        agencyEmail: agency?.email,
      });
    } catch (error: any) {
      console.error("Portal contract error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/payments", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const schedules = await storage.getExternalPaymentSchedulesByContract(contractId);
      const payments = await storage.getExternalPaymentsByContract(contractId);
      res.json({
        schedule: schedules,
        payments,
        monthlyRent: req.portalContract.monthlyRent,
        paymentDueDay: req.portalContract.paymentDueDay,
      });
    } catch (error: any) {
      console.error("Portal payments error:", error);
      handleGenericError(res, error);
    }
  });

  app.post("/api/portal/receipts", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'tenant') {
        return res.status(403).json({ 
          message: "Only tenants can upload payment receipts", 
          message_es: "Solo los inquilinos pueden subir comprobantes de pago" 
        });
      }
      const { paymentId, receiptUrl, amount, paymentDate, notes } = req.body;
      if (!receiptUrl) {
        return res.status(400).json({ 
          message: "Receipt image URL is required", 
          message_es: "La URL de la imagen del comprobante es requerida" 
        });
      }
      const receipt = await storage.createExternalPaymentReceipt({
        contractId: req.portalContract.id,
        agencyId: req.portalAgencyId,
        paymentId: paymentId || null,
        receiptUrl,
        amount: amount || null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        notes: notes || null,
        uploadedBy: 'tenant',
        status: 'pending',
      });
      res.status(201).json({ 
        receipt, 
        message: "Receipt uploaded successfully", 
        message_es: "Comprobante subido exitosamente" 
      });
    } catch (error: any) {
      console.error("Portal receipt upload error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/receipts", verifyPortalSession, async (req: any, res) => {
    try {
      const receipts = await storage.getExternalPaymentReceiptsByContract(req.portalContract.id);
      res.json(receipts);
    } catch (error: any) {
      console.error("Portal receipts error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/maintenance", verifyPortalSession, async (req: any, res) => {
    try {
      const contract = req.portalContract;
      let tickets: any[] = [];
      if (contract.propertyId) {
        tickets = await storage.getExternalMaintenanceTicketsByProperty(contract.propertyId);
      } else if (contract.unitId) {
        tickets = await storage.getExternalMaintenanceTicketsByUnit(contract.unitId);
      }
      res.json(tickets);
    } catch (error: any) {
      console.error("Portal maintenance error:", error);
      handleGenericError(res, error);
    }
  });

  app.post("/api/portal/maintenance", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'tenant') {
        return res.status(403).json({ 
          message: "Only tenants can create maintenance requests", 
          message_es: "Solo los inquilinos pueden crear solicitudes de mantenimiento" 
        });
      }
      const { title, description, category, priority, photos } = req.body;
      if (!title || !description) {
        return res.status(400).json({ 
          message: "Title and description are required", 
          message_es: "Título y descripción son requeridos" 
        });
      }
      const contract = req.portalContract;
      const ticket = await storage.createExternalMaintenanceTicket({
        title,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        agencyId: req.portalAgencyId,
        propertyId: contract.propertyId || null,
        unitId: contract.unitId || null,
        contractId: contract.id,
        reportedBy: 'tenant',
        tenantName: contract.tenantName,
        tenantPhone: contract.tenantPhone,
        tenantEmail: contract.tenantEmail,
      });
      if (photos && Array.isArray(photos)) {
        for (const photoUrl of photos) {
          await storage.createExternalMaintenancePhoto({ ticketId: ticket.id, photoUrl, uploadedBy: 'tenant' });
        }
      }
      res.status(201).json({ 
        ticket, 
        message: "Maintenance request created successfully", 
        message_es: "Solicitud de mantenimiento creada exitosamente" 
      });
    } catch (error: any) {
      console.error("Portal maintenance create error:", error);
      handleGenericError(res, error);
    }
  });

  app.post("/api/portal/termination", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'tenant') {
        return res.status(403).json({ 
          message: "Only tenants can request contract termination", 
          message_es: "Solo los inquilinos pueden solicitar terminación de contrato" 
        });
      }
      const { reason, requestedEndDate, notes } = req.body;
      if (!reason || !requestedEndDate) {
        return res.status(400).json({ 
          message: "Reason and requested end date are required", 
          message_es: "El motivo y la fecha de terminación deseada son requeridos" 
        });
      }
      const existingRequests = await storage.getExternalTerminationRequestsByContract(req.portalContract.id);
      const pendingRequest = existingRequests.find(r => r.status === 'pending');
      if (pendingRequest) {
        return res.status(400).json({ 
          message: "There is already a pending termination request", 
          message_es: "Ya existe una solicitud de terminación pendiente" 
        });
      }
      const termination = await storage.createExternalTerminationRequest({
        contractId: req.portalContract.id,
        agencyId: req.portalAgencyId,
        requestedBy: 'tenant',
        reason,
        requestedEndDate: new Date(requestedEndDate),
        notes: notes || null,
        status: 'pending',
      });
      res.status(201).json({ 
        termination, 
        message: "Termination request submitted successfully", 
        message_es: "Solicitud de terminación enviada exitosamente" 
      });
    } catch (error: any) {
      console.error("Portal termination request error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/termination", verifyPortalSession, async (req: any, res) => {
    try {
      const requests = await storage.getExternalTerminationRequestsByContract(req.portalContract.id);
      res.json(requests);
    } catch (error: any) {
      console.error("Portal termination get error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/services", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'owner') {
        return res.status(403).json({ 
          message: "Only owners can view service accounts", 
          message_es: "Solo los propietarios pueden ver las cuentas de servicios" 
        });
      }
      const services = await storage.getExternalServiceAccountsByContract(req.portalContract.id);
      res.json(services);
    } catch (error: any) {
      console.error("Portal services error:", error);
      handleGenericError(res, error);
    }
  });

  app.post("/api/portal/owner/confirm-payment", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'owner') {
        return res.status(403).json({ 
          message: "Only owners can confirm payments", 
          message_es: "Solo los propietarios pueden confirmar pagos" 
        });
      }
      const { paymentId, amount, receivedDate, notes } = req.body;
      if (!paymentId) {
        return res.status(400).json({ 
          message: "Payment ID is required", 
          message_es: "El ID del pago es requerido" 
        });
      }
      const confirmation = await storage.createExternalOwnerPaymentConfirmation({
        contractId: req.portalContract.id,
        agencyId: req.portalAgencyId,
        paymentId,
        amount: amount || null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        notes: notes || null,
      });
      res.status(201).json({ 
        confirmation, 
        message: "Payment confirmed successfully", 
        message_es: "Pago confirmado exitosamente" 
      });
    } catch (error: any) {
      console.error("Portal payment confirmation error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/owner/confirmations", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole !== 'owner') {
        return res.status(403).json({ 
          message: "Only owners can view payment confirmations", 
          message_es: "Solo los propietarios pueden ver confirmaciones de pago" 
        });
      }
      const confirmations = await storage.getExternalOwnerPaymentConfirmationsByContract(req.portalContract.id);
      res.json(confirmations);
    } catch (error: any) {
      console.error("Portal confirmations error:", error);
      handleGenericError(res, error);
    }
  });

  app.post("/api/portal/chat", verifyPortalSession, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required", message_es: "El mensaje es requerido" });
      }
      
      await storage.createExternalPortalChatMessage({
        contractId: req.portalContract.id,
        agencyId: req.portalAgencyId,
        role: req.portalRole,
        messageType: 'user',
        content: message,
      });
      
      const history = await storage.getExternalPortalChatMessages(req.portalContract.id, req.portalRole);
      const contract = req.portalContract;
      
      const systemPrompt = req.portalRole === 'tenant'
        ? `You are a helpful assistant for a tenant portal. The tenant's name is ${contract.tenantName}. Their monthly rent is ${contract.monthlyRent} MXN, due on day ${contract.paymentDueDay}. Contract runs from ${contract.startDate} to ${contract.endDate}. Be helpful, concise, professional. Answer in the same language the user writes in.`
        : `You are a helpful assistant for a property owner portal. The owner's name is ${contract.ownerName}. Property rented to ${contract.tenantName} for ${contract.monthlyRent} MXN monthly. Contract runs from ${contract.startDate} to ${contract.endDate}. Be helpful, concise, professional. Answer in the same language the user writes in.`;
      
      const messages = history.slice(-10).map(m => ({ 
        role: m.messageType === 'user' ? 'user' as const : 'assistant' as const, 
        content: m.content 
      }));
      messages.push({ role: 'user' as const, content: message });
      
      let aiResponse = "I apologize, but I'm currently unable to process your request. Please try again later.";
      
      try {
        if (process.env.OPENAI_API_KEY) {
          const { OpenAI } = await import('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            max_tokens: 500,
            temperature: 0.7,
          });
          aiResponse = completion.choices[0]?.message?.content || aiResponse;
        }
      } catch (aiError) {
        console.error("AI chat error:", aiError);
      }
      
      await storage.createExternalPortalChatMessage({
        contractId: req.portalContract.id,
        agencyId: req.portalAgencyId,
        role: req.portalRole,
        messageType: 'assistant',
        content: aiResponse,
      });
      
      res.json({ response: aiResponse, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("Portal chat error:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/portal/chat", verifyPortalSession, async (req: any, res) => {
    try {
      const messages = await storage.getExternalPortalChatMessages(req.portalContract.id, req.portalRole);
      res.json(messages);
    } catch (error: any) {
      console.error("Portal chat history error:", error);
      handleGenericError(res, error);
    }
  });

  // Admin endpoints for portal management
  app.post("/api/external/contracts/:id/generate-portal-access", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      if (!role || !['tenant', 'owner'].includes(role)) {
        return res.status(400).json({ message: "Role must be 'tenant' or 'owner'" });
      }
      
      const contract = await storage.getExternalRentalContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      if (contract.agencyId !== agencyId) {
        return res.status(403).json({ message: "Not authorized to access this contract" });
      }
      
      const accessCode = `${role.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const plainPassword = crypto.randomBytes(6).toString('hex').toUpperCase();
      const hashedSecret = await bcrypt.hash(plainPassword, 10);
      const expiresAt = contract.endDate ? new Date(contract.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const token = await storage.createExternalPortalAccessToken({
        contractId: id,
        agencyId,
        role: role as 'tenant' | 'owner',
        accessCode,
        hashedSecret,
        expiresAt,
        status: 'active',
      });
      
      await createAuditLog(req, "create", "external_portal_access_token", token.id, `Generated ${role} portal access for contract ${id}`);
      
      res.status(201).json({
        token: { id: token.id, role: token.role, accessCode, expiresAt: token.expiresAt, status: token.status },
        credentials: { accessCode, password: plainPassword, portalUrl: `/portal/${role}` },
        message: `Portal access created for ${role}`,
        message_es: `Acceso al portal creado para ${role === 'tenant' ? 'inquilino' : 'propietario'}`
      });
    } catch (error: any) {
      console.error("Error generating portal access:", error);
      handleGenericError(res, error);
    }
  });

  app.get("/api/external/contracts/:id/portal-tokens", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(id);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const tokens = await storage.getExternalPortalAccessTokensByContract(id);
      const safeTokens = tokens.map(t => ({
        id: t.id,
        role: t.role,
        accessCode: t.accessCode,
        status: t.status,
        expiresAt: t.expiresAt,
        lastUsedAt: t.lastUsedAt,
        usageCount: t.usageCount,
        createdAt: t.createdAt,
      }));
      
      res.json(safeTokens);
    } catch (error: any) {
      console.error("Error getting portal tokens:", error);
      handleGenericError(res, error);
    }
  });

  app.delete("/api/external/portal-tokens/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const token = await storage.getExternalPortalAccessToken(id);
      if (!token || token.agencyId !== agencyId) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      await storage.revokeExternalPortalAccessToken(id);
      await createAuditLog(req, "delete", "external_portal_access_token", id, `Revoked portal access token`);
      
      res.json({ message: "Portal access revoked", message_es: "Acceso al portal revocado" });
    } catch (error: any) {
      console.error("Error revoking portal token:", error);
      handleGenericError(res, error);
    }
  });

  // GET all portal tokens for the agency
  app.get("/api/external/portal-tokens", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }

      const { role, status } = req.query;
      const filters: { role?: string; status?: string } = {};
      if (role && ['tenant', 'owner'].includes(role)) {
        filters.role = role;
      }
      if (status && ['active', 'revoked', 'expired'].includes(status)) {
        filters.status = status;
      }

      const tokens = await storage.getExternalPortalAccessTokensByAgency(agencyId, filters);
      res.json(tokens);
    } catch (error: any) {
      console.error("Error getting portal tokens:", error);
      handleGenericError(res, error);
    }
  });

  // POST reset password for a portal token
  app.post("/api/external/portal-tokens/:id/reset-password", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }

      const token = await storage.getExternalPortalAccessToken(id);
      if (!token || token.agencyId !== agencyId) {
        return res.status(404).json({ message: "Token not found" });
      }

      if (token.status !== 'active') {
        return res.status(400).json({ message: "Cannot reset password for inactive token" });
      }

      const plainPassword = crypto.randomBytes(6).toString('hex').toUpperCase();
      const hashedSecret = await bcrypt.hash(plainPassword, 10);

      await storage.updateExternalPortalAccessToken(id, { hashedSecret });
      await createAuditLog(req, "update", "external_portal_access_token", id, `Reset password for portal token`);

      res.json({
        success: true,
        accessCode: token.accessCode,
        password: plainPassword,
        message: "Password reset successfully",
        message_es: "Contraseña restablecida exitosamente"
      });
    } catch (error: any) {
      console.error("Error resetting portal password:", error);
      handleGenericError(res, error);
    }
  });

  // ============================================
  // PORTAL 2.0 - ENHANCED PORTAL ROUTES
  // ============================================

  // ----- Service Configurations -----
  
  // GET service configs for a contract (portal users)
  app.get("/api/portal/services", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const role = req.portalRole;
      
      const configs = await storage.getPortalServiceConfigs(contractId, { isActive: true });
      
      // Filter based on role - tenants only see services marked showToTenant
      const filtered = role === 'tenant' 
        ? configs.filter(c => c.showToTenant)
        : configs;
      
      res.json(filtered);
    } catch (error: any) {
      console.error("Error getting portal service configs:", error);
      handleGenericError(res, error);
    }
  });

  // POST create service config (owner/admin only)
  app.post("/api/portal/services", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole === 'tenant') {
        return res.status(403).json({ message: "Only owners can configure services", message_es: "Solo propietarios pueden configurar servicios" });
      }
      
      const config = await storage.createPortalServiceConfig({
        ...req.body,
        agencyId: req.portalAgencyId,
        contractId: req.portalContract.id,
        createdByRole: req.portalRole,
      });
      
      res.status(201).json(config);
    } catch (error: any) {
      console.error("Error creating portal service config:", error);
      handleGenericError(res, error);
    }
  });

  // PUT update service config
  app.put("/api/portal/services/:id", verifyPortalSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const config = await storage.getPortalServiceConfig(id);
      
      if (!config || config.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Service not found", message_es: "Servicio no encontrado" });
      }
      
      // Tenants can only edit if tenantCanEdit is true, and only certain fields
      if (req.portalRole === 'tenant') {
        if (!config.tenantCanEdit) {
          return res.status(403).json({ message: "You cannot edit this service", message_es: "No puedes editar este servicio" });
        }
        // Restrict to only certain fields for tenant
        const { accountNumber, notes } = req.body;
        const updated = await storage.updatePortalServiceConfig(id, { accountNumber, notes });
        return res.json(updated);
      }
      
      const updated = await storage.updatePortalServiceConfig(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating portal service config:", error);
      handleGenericError(res, error);
    }
  });

  // DELETE service config (owner only)
  app.delete("/api/portal/services/:id", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole === 'tenant') {
        return res.status(403).json({ message: "Only owners can delete services", message_es: "Solo propietarios pueden eliminar servicios" });
      }
      
      const { id } = req.params;
      const config = await storage.getPortalServiceConfig(id);
      
      if (!config || config.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Service not found", message_es: "Servicio no encontrado" });
      }
      
      await storage.deletePortalServiceConfig(id);
      res.json({ message: "Service deleted", message_es: "Servicio eliminado" });
    } catch (error: any) {
      console.error("Error deleting portal service config:", error);
      handleGenericError(res, error);
    }
  });

  // ----- Payment Records -----
  
  // GET payment records for a contract
  app.get("/api/portal/payments", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const { status, category, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      
      const records = await storage.getPortalPaymentRecords(contractId, filters);
      
      // If tenant, hide owner notes
      if (req.portalRole === 'tenant') {
        const sanitized = records.map(r => ({ ...r, ownerNotes: undefined }));
        return res.json(sanitized);
      }
      
      res.json(records);
    } catch (error: any) {
      console.error("Error getting portal payment records:", error);
      handleGenericError(res, error);
    }
  });

  // GET payment summary
  app.get("/api/portal/payments/summary", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const summary = await storage.getPortalPaymentSummary(contractId);
      res.json(summary);
    } catch (error: any) {
      console.error("Error getting payment summary:", error);
      handleGenericError(res, error);
    }
  });

  // POST create payment record (either role can create)
  app.post("/api/portal/payments", verifyPortalSession, async (req: any, res) => {
    try {
      const record = await storage.createPortalPaymentRecord({
        ...req.body,
        agencyId: req.portalAgencyId,
        contractId: req.portalContract.id,
      });
      
      res.status(201).json(record);
    } catch (error: any) {
      console.error("Error creating portal payment record:", error);
      handleGenericError(res, error);
    }
  });

  // PUT update payment record
  app.put("/api/portal/payments/:id", verifyPortalSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getPortalPaymentRecord(id);
      
      if (!record || record.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Payment not found", message_es: "Pago no encontrado" });
      }
      
      const updated = await storage.updatePortalPaymentRecord(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating portal payment record:", error);
      handleGenericError(res, error);
    }
  });

  // POST mark payment as paid (tenant action)
  app.post("/api/portal/payments/:id/mark-paid", verifyPortalSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getPortalPaymentRecord(id);
      
      if (!record || record.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Payment not found", message_es: "Pago no encontrado" });
      }
      
      const { receiptUrl, receiptFileName, tenantNotes } = req.body;
      
      const updated = await storage.updatePortalPaymentRecord(id, {
        status: 'paid',
        datePaid: new Date(),
        paidBy: req.portalRole,
        paidByTokenId: req.portalToken.id,
        receiptUrl,
        receiptFileName,
        tenantNotes,
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error marking payment as paid:", error);
      handleGenericError(res, error);
    }
  });

  // POST verify payment (owner action)
  app.post("/api/portal/payments/:id/verify", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole === 'tenant') {
        return res.status(403).json({ message: "Only owners can verify payments", message_es: "Solo propietarios pueden verificar pagos" });
      }
      
      const { id } = req.params;
      const record = await storage.getPortalPaymentRecord(id);
      
      if (!record || record.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Payment not found", message_es: "Pago no encontrado" });
      }
      
      const { ownerNotes } = req.body;
      
      const updated = await storage.updatePortalPaymentRecord(id, {
        status: 'verified',
        verifiedByRole: 'owner',
        verifiedAt: new Date(),
        ownerNotes,
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      handleGenericError(res, error);
    }
  });

  // POST reject payment (owner action)
  app.post("/api/portal/payments/:id/reject", verifyPortalSession, async (req: any, res) => {
    try {
      if (req.portalRole === 'tenant') {
        return res.status(403).json({ message: "Only owners can reject payments", message_es: "Solo propietarios pueden rechazar pagos" });
      }
      
      const { id } = req.params;
      const record = await storage.getPortalPaymentRecord(id);
      
      if (!record || record.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Payment not found", message_es: "Pago no encontrado" });
      }
      
      const { ownerNotes } = req.body;
      
      const updated = await storage.updatePortalPaymentRecord(id, {
        status: 'rejected',
        verifiedByRole: 'owner',
        verifiedAt: new Date(),
        ownerNotes,
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      handleGenericError(res, error);
    }
  });

  // ----- Documents -----
  
  // GET documents for a contract
  app.get("/api/portal/documents", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const { documentType } = req.query;
      
      const filters: any = {};
      if (documentType) filters.documentType = documentType;
      
      // Filter by visibility based on role
      if (req.portalRole === 'tenant') {
        filters.visibleToTenant = true;
      } else {
        filters.visibleToOwner = true;
      }
      
      const documents = await storage.getPortalDocuments(contractId, filters);
      res.json(documents);
    } catch (error: any) {
      console.error("Error getting portal documents:", error);
      handleGenericError(res, error);
    }
  });

  // POST upload document
  app.post("/api/portal/documents", verifyPortalSession, async (req: any, res) => {
    try {
      const document = await storage.createPortalDocument({
        ...req.body,
        agencyId: req.portalAgencyId,
        contractId: req.portalContract.id,
        uploadedByRole: req.portalRole,
        uploadedByTokenId: req.portalToken.id,
      });
      
      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error creating portal document:", error);
      handleGenericError(res, error);
    }
  });

  // PUT update document
  app.put("/api/portal/documents/:id", verifyPortalSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getPortalDocument(id);
      
      if (!document || document.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Document not found", message_es: "Documento no encontrado" });
      }
      
      // Only owner or uploader can edit
      if (req.portalRole === 'tenant' && document.uploadedByTokenId !== req.portalToken.id) {
        return res.status(403).json({ message: "You cannot edit this document", message_es: "No puedes editar este documento" });
      }
      
      const updated = await storage.updatePortalDocument(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating portal document:", error);
      handleGenericError(res, error);
    }
  });

  // DELETE document
  app.delete("/api/portal/documents/:id", verifyPortalSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getPortalDocument(id);
      
      if (!document || document.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Document not found", message_es: "Documento no encontrado" });
      }
      
      // Only owner or uploader can delete
      if (req.portalRole === 'tenant' && document.uploadedByTokenId !== req.portalToken.id) {
        return res.status(403).json({ message: "You cannot delete this document", message_es: "No puedes eliminar este documento" });
      }
      
      await storage.deletePortalDocument(id);
      res.json({ message: "Document deleted", message_es: "Documento eliminado" });
    } catch (error: any) {
      console.error("Error deleting portal document:", error);
      handleGenericError(res, error);
    }
  });

  // ----- Enhanced Messages -----
  
  // GET messages for a contract
  app.get("/api/portal/messages", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const { messageType } = req.query;
      
      const filters: any = {};
      if (messageType) filters.messageType = messageType;
      
      // Tenants cannot see internal messages
      if (req.portalRole === 'tenant') {
        filters.isInternal = false;
      }
      
      const messages = await storage.getPortalMessages(contractId, filters);
      
      // Mark as read
      await storage.markPortalMessagesAsRead(contractId, req.portalRole);
      
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting portal messages:", error);
      handleGenericError(res, error);
    }
  });

  // GET unread count
  app.get("/api/portal/messages/unread", verifyPortalSession, async (req: any, res) => {
    try {
      const contractId = req.portalContract.id;
      const count = await storage.getPortalUnreadCount(contractId, req.portalRole);
      res.json({ unread: count });
    } catch (error: any) {
      console.error("Error getting unread count:", error);
      handleGenericError(res, error);
    }
  });

  // POST send message
  app.post("/api/portal/messages", verifyPortalSession, async (req: any, res) => {
    try {
      const { content, isInternal, attachmentUrl, attachmentName, attachmentType, relatedEntityType, relatedEntityId } = req.body;
      
      // Tenants cannot send internal messages
      if (req.portalRole === 'tenant' && isInternal) {
        return res.status(403).json({ message: "Tenants cannot send internal messages", message_es: "Inquilinos no pueden enviar mensajes internos" });
      }
      
      const message = await storage.createPortalMessage({
        agencyId: req.portalAgencyId,
        contractId: req.portalContract.id,
        senderRole: req.portalRole,
        senderTokenId: req.portalToken.id,
        senderName: req.portalRole === 'tenant' ? req.portalContract.tenantName : req.portalContract.ownerName,
        messageType: 'user',
        content,
        isInternal: isInternal || false,
        attachmentUrl,
        attachmentName,
        attachmentType,
        relatedEntityType,
        relatedEntityId,
        // Messages from sender are marked as read by sender
        readByTenant: req.portalRole === 'tenant',
        readByOwner: req.portalRole === 'owner',
      });
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating portal message:", error);
      handleGenericError(res, error);
    }
  });

  // ----- Ticket Updates -----
  
  // GET ticket updates/timeline
  app.get("/api/portal/tickets/:ticketId/updates", verifyPortalSession, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      
      // Verify ticket belongs to this contract
      const ticket = await storage.getExternalMaintenanceTicket(ticketId);
      if (!ticket || ticket.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Ticket not found", message_es: "Ticket no encontrado" });
      }
      
      const filters: any = {};
      // Tenants cannot see internal updates
      if (req.portalRole === 'tenant') {
        filters.isInternal = false;
      }
      
      const updates = await storage.getPortalTicketUpdates(ticketId, filters);
      res.json(updates);
    } catch (error: any) {
      console.error("Error getting ticket updates:", error);
      handleGenericError(res, error);
    }
  });

  // POST add ticket update/comment
  app.post("/api/portal/tickets/:ticketId/updates", verifyPortalSession, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const { updateType, comment, isInternal, attachmentUrl, attachmentName, newStatus } = req.body;
      
      // Verify ticket belongs to this contract
      const ticket = await storage.getExternalMaintenanceTicket(ticketId);
      if (!ticket || ticket.contractId !== req.portalContract.id) {
        return res.status(404).json({ message: "Ticket not found", message_es: "Ticket no encontrado" });
      }
      
      // Tenants cannot add internal updates
      if (req.portalRole === 'tenant' && isInternal) {
        return res.status(403).json({ message: "Tenants cannot add internal updates", message_es: "Inquilinos no pueden agregar actualizaciones internas" });
      }
      
      const update = await storage.createPortalTicketUpdate({
        ticketId,
        updateType: updateType || 'comment',
        comment,
        isInternal: isInternal || false,
        updatedByRole: req.portalRole,
        updatedByTokenId: req.portalToken.id,
        updatedByName: req.portalRole === 'tenant' ? req.portalContract.tenantName : req.portalContract.ownerName,
        previousStatus: ticket.status,
        newStatus,
        attachmentUrl,
        attachmentName,
      });
      
      // If status change requested, update the ticket
      if (newStatus && newStatus !== ticket.status) {
        await storage.updateExternalMaintenanceTicket(ticketId, { status: newStatus });
      }
      
      res.status(201).json(update);
    } catch (error: any) {
      console.error("Error creating ticket update:", error);
      handleGenericError(res, error);
    }
  });

  // ----- Admin Routes for Portal 2.0 -----

  // GET service configs for admin (by contract)
  app.get("/api/external/contracts/:contractId/services", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const configs = await storage.getPortalServiceConfigs(contractId);
      res.json(configs);
    } catch (error: any) {
      console.error("Error getting service configs:", error);
      handleGenericError(res, error);
    }
  });

  // POST create service config (admin)
  app.post("/api/external/contracts/:contractId/services", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const config = await storage.createPortalServiceConfig({
        ...req.body,
        agencyId,
        contractId,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "portal_service_config", config.id, `Created service config: ${config.serviceType}`);
      res.status(201).json(config);
    } catch (error: any) {
      console.error("Error creating service config:", error);
      handleGenericError(res, error);
    }
  });

  // GET payment records for admin (by contract)
  app.get("/api/external/contracts/:contractId/payments", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const { status, category } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      
      const records = await storage.getPortalPaymentRecords(contractId, filters);
      res.json(records);
    } catch (error: any) {
      console.error("Error getting payment records:", error);
      handleGenericError(res, error);
    }
  });

  // POST create payment record (admin)
  app.post("/api/external/contracts/:contractId/payments", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const record = await storage.createPortalPaymentRecord({
        ...req.body,
        agencyId,
        contractId,
      });
      
      await createAuditLog(req, "create", "portal_payment_record", record.id, `Created payment record: ${record.category}`);
      res.status(201).json(record);
    } catch (error: any) {
      console.error("Error creating payment record:", error);
      handleGenericError(res, error);
    }
  });

  // PUT verify payment (admin)
  app.put("/api/external/payments/:id/verify", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const record = await storage.getPortalPaymentRecord(id);
      if (!record || record.agencyId !== agencyId) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const updated = await storage.updatePortalPaymentRecord(id, {
        status: 'verified',
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        ownerNotes: req.body.ownerNotes,
      });
      
      await createAuditLog(req, "update", "portal_payment_record", id, `Verified payment record`);
      res.json(updated);
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      handleGenericError(res, error);
    }
  });

  // GET messages for admin (by contract)
  app.get("/api/external/contracts/:contractId/messages", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const messages = await storage.getPortalMessages(contractId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting messages:", error);
      handleGenericError(res, error);
    }
  });

  // POST send message as admin
  app.post("/api/external/contracts/:contractId/messages", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const agencyId = await getUserAgencyId(req);
      
      if (!agencyId) {
        return res.status(403).json({ message: "User is not assigned to any agency" });
      }
      
      const contract = await storage.getExternalRentalContract(contractId);
      if (!contract || contract.agencyId !== agencyId) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const { content, isInternal, attachmentUrl, attachmentName, attachmentType } = req.body;
      
      const message = await storage.createPortalMessage({
        agencyId,
        contractId,
        senderUserId: req.user.id,
        senderName: req.user.name || req.user.email,
        messageType: 'user',
        content,
        isInternal: isInternal || false,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      handleGenericError(res, error);
    }
  });
}
