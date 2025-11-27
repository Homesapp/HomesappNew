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

      const passwordValid = await bcrypt.compare(password, token.accessCodeHash);
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
      const accessCodeHash = await bcrypt.hash(plainPassword, 10);
      const expiresAt = contract.endDate ? new Date(contract.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const token = await storage.createExternalPortalAccessToken({
        contractId: id,
        agencyId,
        role: role as 'tenant' | 'owner',
        accessCode,
        accessCodeHash,
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
}
