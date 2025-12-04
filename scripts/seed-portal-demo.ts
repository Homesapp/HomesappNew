/**
 * Seed Demo Portal Data
 * 
 * Creates demo accounts for testing Portal 2.0:
 * - demo.inquilino@homesapp.com (Tenant)
 * - demo.propietario@homesapp.com (Owner)
 * 
 * Run with: npx tsx scripts/seed-portal-demo.ts
 */

import { db } from "../server/db";
import { 
  users, 
  externalUnits, 
  externalRentalContracts,
  externalPortalAccessTokens,
  portalServiceConfigs,
  portalPaymentRecords,
  portalDocuments,
  portalMessages,
  externalMaintenanceTickets,
  portalTicketUpdates,
  externalPortalChatMessages,
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Configuration
const AGENCY_ID = "6c2c26c5-a268-4451-ae67-8ee56e89b87f"; // Tulum Rental Homes
const DEMO_PASSWORD = "DemoTRH2024!";

// Generate IDs for linking
const DEMO_TENANT_ID = crypto.randomUUID();
const DEMO_OWNER_ID = crypto.randomUUID();
const DEMO_UNIT_ID = crypto.randomUUID();
const DEMO_CONTRACT_ID = crypto.randomUUID();
const DEMO_TENANT_TOKEN_ID = crypto.randomUUID();
const DEMO_OWNER_TOKEN_ID = crypto.randomUUID();
const DEMO_SERVICE_RENT_ID = crypto.randomUUID();
const DEMO_SERVICE_CFE_ID = crypto.randomUUID();
const DEMO_SERVICE_AGUA_ID = crypto.randomUUID();
const DEMO_SERVICE_INTERNET_ID = crypto.randomUUID();
const DEMO_TICKET_OPEN_ID = crypto.randomUUID();
const DEMO_TICKET_RESOLVED_ID = crypto.randomUUID();

async function seedDemoData() {
  console.log("🌱 Starting Portal 2.0 Demo Data Seed...\n");

  try {
    // 1. Clean up existing demo data (in correct order due to FK constraints)
    console.log("🧹 Cleaning up existing demo data...");
    
    // First, find existing demo users and their related data
    const existingTenantUser = await db.select({ id: users.id }).from(users).where(eq(users.email, "demo.inquilino@homesapp.com")).limit(1);
    const existingOwnerUser = await db.select({ id: users.id }).from(users).where(eq(users.email, "demo.propietario@homesapp.com")).limit(1);
    
    const tenantId = existingTenantUser[0]?.id;
    const ownerId = existingOwnerUser[0]?.id;
    
    // Clean up portal access tokens referencing these users
    if (tenantId) {
      await db.delete(externalPortalAccessTokens).where(eq(externalPortalAccessTokens.invitedUserId, tenantId));
    }
    if (ownerId) {
      await db.delete(externalPortalAccessTokens).where(eq(externalPortalAccessTokens.invitedUserId, ownerId));
    }
    
    // Clean up existing demo units (will cascade to contracts and portal data)
    await db.execute(sql`DELETE FROM external_units WHERE unit_number = 'DEMO-101' AND agency_id = ${AGENCY_ID}`);
    
    // Now safe to delete users
    await db.delete(users).where(eq(users.email, "demo.inquilino@homesapp.com"));
    await db.delete(users).where(eq(users.email, "demo.propietario@homesapp.com"));
    
    console.log("✓ Cleaned up existing demo data\n");

    // 2. Create demo users
    console.log("👤 Creating demo users...");
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    
    // Tenant user
    await db.insert(users).values({
      id: DEMO_TENANT_ID,
      email: "demo.inquilino@homesapp.com",
      passwordHash: hashedPassword,
      firstName: "Inquilino Demo",
      lastName: "TRH",
      role: "cliente", // Base role for portal users
      status: "approved",
      emailVerified: true,
      preferredLanguage: "es",
      externalAgencyId: AGENCY_ID,
    });
    console.log("✓ Created tenant: demo.inquilino@homesapp.com");

    // Owner user
    await db.insert(users).values({
      id: DEMO_OWNER_ID,
      email: "demo.propietario@homesapp.com",
      passwordHash: hashedPassword,
      firstName: "Propietario Demo",
      lastName: "TRH",
      role: "cliente",
      status: "approved",
      emailVerified: true,
      preferredLanguage: "es",
      externalAgencyId: AGENCY_ID,
    });
    console.log("✓ Created owner: demo.propietario@homesapp.com\n");

    // 3. Create demo property (unit)
    console.log("🏠 Creating demo property...");
    
    await db.insert(externalUnits).values({
      id: DEMO_UNIT_ID,
      agencyId: AGENCY_ID,
      unitNumber: "DEMO-101",
      title: "Departamento Demo - Aldea Zama",
      description: "Hermoso departamento de 2 recámaras y 2 baños completamente amueblado en Aldea Zama. Cuenta con amenidades de lujo y ubicación privilegiada. Pet friendly.",
      zone: "Aldea Zama",
      city: "Tulum",
      propertyType: "Departamento",
      bedrooms: 2,
      bathrooms: "2",
      area: "85.00",
      price: "25000.00",
      currency: "MXN",
      petFriendly: true,
      isActive: true,
      listingType: "rent",
      minimumTerm: "6 meses",
      maximumTerm: "12 meses",
      amenities: ["Piscina", "Gym", "Seguridad 24/7", "Estacionamiento", "Roof Garden"],
      address: "Aldea Zama, Carretera Tulum-Boca Paila, Tulum, Q.Roo",
    });
    console.log("✓ Created property: Departamento Demo - Aldea Zama\n");

    // 4. Create demo contract
    console.log("📝 Creating demo contract...");
    
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 2); // 2 months ago
    
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 10); // 10 months from now
    
    await db.insert(externalRentalContracts).values({
      id: DEMO_CONTRACT_ID,
      agencyId: AGENCY_ID,
      unitId: DEMO_UNIT_ID,
      tenantName: "Inquilino Demo TRH",
      tenantEmail: "demo.inquilino@homesapp.com",
      tenantPhone: "+52 984 123 4567",
      monthlyRent: "25000.00",
      currency: "MXN",
      securityDeposit: "25000.00",
      leaseDurationMonths: 12,
      startDate: startDate,
      endDate: endDate,
      status: "active",
      hasPet: true,
      petName: "Luna",
      petDescription: "Perrita french poodle, 3 años, muy tranquila",
      notes: "Contrato demo para pruebas de Portal 2.0",
    });
    console.log("✓ Created contract with 12-month lease\n");

    // 5. Create portal access tokens
    console.log("🔑 Creating portal access tokens...");
    
    // Tenant token
    const tenantAccessCode = "DEMO1234";
    const tenantSecret = crypto.randomBytes(32).toString("hex");
    const tenantHashedSecret = await bcrypt.hash(tenantSecret, 10);
    
    await db.insert(externalPortalAccessTokens).values({
      id: DEMO_TENANT_TOKEN_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "tenant",
      accessCode: tenantAccessCode,
      hashedSecret: tenantHashedSecret,
      email: "demo.inquilino@homesapp.com",
      recipientName: "Inquilino Demo TRH",
      invitedUserId: DEMO_TENANT_ID,
      status: "active",
      expiresAt: endDate, // Expires when contract ends
    });
    console.log(`✓ Created tenant token: ${tenantAccessCode}`);

    // Owner token
    const ownerAccessCode = "OWNER123";
    const ownerSecret = crypto.randomBytes(32).toString("hex");
    const ownerHashedSecret = await bcrypt.hash(ownerSecret, 10);
    
    await db.insert(externalPortalAccessTokens).values({
      id: DEMO_OWNER_TOKEN_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "owner",
      accessCode: ownerAccessCode,
      hashedSecret: ownerHashedSecret,
      email: "demo.propietario@homesapp.com",
      recipientName: "Propietario Demo TRH",
      invitedUserId: DEMO_OWNER_ID,
      status: "active",
      expiresAt: null, // Owner access doesn't expire
    });
    console.log(`✓ Created owner token: ${ownerAccessCode}\n`);

    // 6. Create service configs
    console.log("⚙️ Creating portal service configs...");
    
    // Rent
    await db.insert(portalServiceConfigs).values({
      id: DEMO_SERVICE_RENT_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceType: "rent",
      customName: "Renta Mensual",
      paymentFrequency: "monthly",
      responsibleParty: "tenant",
      expectedAmount: "25000.00",
      currency: "MXN",
      dueDay: 1,
      paymentInstructions: "Transferencia bancaria a la cuenta de Tulum Rental Homes",
      isActive: true,
      showToTenant: true,
    });
    console.log("✓ Created rent service config");

    // CFE (electricity)
    await db.insert(portalServiceConfigs).values({
      id: DEMO_SERVICE_CFE_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceType: "electricity",
      customName: "CFE - Electricidad",
      providerName: "CFE",
      accountNumber: "CFE-123456789",
      paymentFrequency: "bimonthly",
      responsibleParty: "tenant",
      expectedAmount: "1500.00",
      currency: "MXN",
      paymentUrl: "https://www.cfe.mx/pagos",
      isActive: true,
      showToTenant: true,
    });
    console.log("✓ Created CFE service config");

    // Water
    await db.insert(portalServiceConfigs).values({
      id: DEMO_SERVICE_AGUA_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceType: "water",
      customName: "CAPA - Agua",
      providerName: "CAPA",
      accountNumber: "CAPA-987654321",
      paymentFrequency: "bimonthly",
      responsibleParty: "tenant",
      expectedAmount: "400.00",
      currency: "MXN",
      isActive: true,
      showToTenant: true,
    });
    console.log("✓ Created water service config");

    // Internet
    await db.insert(portalServiceConfigs).values({
      id: DEMO_SERVICE_INTERNET_ID,
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceType: "internet",
      customName: "Telmex - Internet",
      providerName: "Telmex",
      accountNumber: "TEL-555666777",
      paymentFrequency: "monthly",
      responsibleParty: "tenant",
      expectedAmount: "899.00",
      currency: "MXN",
      isActive: true,
      showToTenant: true,
    });
    console.log("✓ Created internet service config\n");

    // 7. Create payment records
    console.log("💰 Creating payment records...");
    
    const month1 = new Date(startDate);
    const month2 = new Date(startDate);
    month2.setMonth(month2.getMonth() + 1);
    const currentMonth = new Date(now);
    currentMonth.setDate(1);
    const overdueMonth = new Date(now);
    overdueMonth.setMonth(overdueMonth.getMonth() - 1);
    overdueMonth.setDate(15);

    // Verified payments (past 2 months)
    await db.insert(portalPaymentRecords).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceConfigId: DEMO_SERVICE_RENT_ID,
      category: "rent",
      description: "Renta del mes 1",
      dateDue: month1.toISOString().split('T')[0],
      datePaid: new Date(month1.getTime() + 86400000), // Paid next day
      amount: "25000.00",
      currency: "MXN",
      status: "verified",
      periodMonth: month1.getMonth() + 1,
      periodYear: month1.getFullYear(),
      paidBy: "tenant",
      paidByTokenId: DEMO_TENANT_TOKEN_ID,
    });
    console.log("✓ Created verified payment (month 1)");

    await db.insert(portalPaymentRecords).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceConfigId: DEMO_SERVICE_RENT_ID,
      category: "rent",
      description: "Renta del mes 2",
      dateDue: month2.toISOString().split('T')[0],
      datePaid: new Date(month2.getTime() + 172800000), // Paid 2 days later
      amount: "25000.00",
      currency: "MXN",
      status: "verified",
      periodMonth: month2.getMonth() + 1,
      periodYear: month2.getFullYear(),
      paidBy: "tenant",
      paidByTokenId: DEMO_TENANT_TOKEN_ID,
    });
    console.log("✓ Created verified payment (month 2)");

    // Pending payment (current month)
    await db.insert(portalPaymentRecords).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceConfigId: DEMO_SERVICE_RENT_ID,
      category: "rent",
      description: "Renta del mes actual",
      dateDue: currentMonth.toISOString().split('T')[0],
      amount: "25000.00",
      currency: "MXN",
      status: "pending",
      periodMonth: currentMonth.getMonth() + 1,
      periodYear: currentMonth.getFullYear(),
    });
    console.log("✓ Created pending payment (current month)");

    // Overdue payment (CFE)
    await db.insert(portalPaymentRecords).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      serviceConfigId: DEMO_SERVICE_CFE_ID,
      category: "electricity",
      description: "CFE - Periodo bimestral",
      dateDue: overdueMonth.toISOString().split('T')[0],
      amount: "1850.00",
      currency: "MXN",
      status: "overdue",
      tenantNotes: "Pendiente de pago - se recibió recibo con recargo",
    });
    console.log("✓ Created overdue payment (CFE)\n");

    // 8. Create portal documents
    console.log("📄 Creating portal documents...");
    
    await db.insert(portalDocuments).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      documentType: "lease",
      title: "Contrato de Arrendamiento",
      description: "Contrato de arrendamiento original firmado",
      fileUrl: "/demo/contrato-arrendamiento-demo.pdf",
      fileName: "contrato-arrendamiento-demo.pdf",
      mimeType: "application/pdf",
      visibleToTenant: true,
      visibleToOwner: true,
      documentDate: startDate.toISOString().split('T')[0],
    });
    console.log("✓ Created lease document");

    await db.insert(portalDocuments).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      documentType: "receipt",
      title: "Recibo de Renta - Mes 1",
      description: "Comprobante de pago del primer mes",
      fileUrl: "/demo/recibo-renta-mes1.pdf",
      fileName: "recibo-renta-mes1.pdf",
      mimeType: "application/pdf",
      visibleToTenant: true,
      visibleToOwner: true,
      documentDate: month1.toISOString().split('T')[0],
    });
    console.log("✓ Created receipt document (month 1)");

    await db.insert(portalDocuments).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      documentType: "receipt",
      title: "Recibo de Renta - Mes 2",
      description: "Comprobante de pago del segundo mes",
      fileUrl: "/demo/recibo-renta-mes2.pdf",
      fileName: "recibo-renta-mes2.pdf",
      mimeType: "application/pdf",
      visibleToTenant: true,
      visibleToOwner: true,
      documentDate: month2.toISOString().split('T')[0],
    });
    console.log("✓ Created receipt document (month 2)");

    await db.insert(portalDocuments).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      documentType: "other",
      title: "Reporte de Ingresos - Solo Propietario",
      description: "Resumen de ingresos del trimestre (documento interno)",
      fileUrl: "/demo/reporte-ingresos-interno.pdf",
      fileName: "reporte-ingresos-interno.pdf",
      mimeType: "application/pdf",
      visibleToTenant: false,
      visibleToOwner: true,
    });
    console.log("✓ Created owner-only document\n");

    // 9. Create maintenance tickets
    console.log("🔧 Creating maintenance tickets...");
    
    // Open ticket
    await db.insert(externalMaintenanceTickets).values({
      id: DEMO_TICKET_OPEN_ID,
      agencyId: AGENCY_ID,
      unitId: DEMO_UNIT_ID,
      contractId: DEMO_CONTRACT_ID,
      title: "Fuga en baño principal",
      description: "Se detectó una fuga de agua debajo del lavabo del baño principal. El agua gotea constantemente y está mojando el piso.",
      category: "plumbing",
      priority: "high",
      status: "in_progress",
      reportedBy: "Inquilino Demo TRH",
      estimatedCost: "2500.00",
    });
    console.log("✓ Created open ticket: Fuga en baño");

    // Resolved ticket
    const resolvedDate = new Date(now);
    resolvedDate.setDate(resolvedDate.getDate() - 5);
    
    await db.insert(externalMaintenanceTickets).values({
      id: DEMO_TICKET_RESOLVED_ID,
      agencyId: AGENCY_ID,
      unitId: DEMO_UNIT_ID,
      contractId: DEMO_CONTRACT_ID,
      title: "Mantenimiento de A/C",
      description: "El aire acondicionado del cuarto principal no enfría correctamente. Hace ruido extraño al encender.",
      category: "hvac",
      priority: "medium",
      status: "closed",
      reportedBy: "Inquilino Demo TRH",
      actualCost: "1800.00",
      resolvedDate: resolvedDate,
      completionNotes: "Se realizó limpieza de filtros y recarga de gas refrigerante. El equipo quedó funcionando correctamente.",
    });
    console.log("✓ Created resolved ticket: Mantenimiento de A/C");

    // Create ticket updates
    await db.insert(portalTicketUpdates).values({
      id: crypto.randomUUID(),
      ticketId: DEMO_TICKET_OPEN_ID,
      updateType: "status_change",
      previousStatus: "open",
      newStatus: "in_progress",
      comment: "Se asignó técnico plomero. Visitará mañana entre 10am y 12pm.",
      isInternal: false,
      updatedByRole: "owner",
    });

    await db.insert(portalTicketUpdates).values({
      id: crypto.randomUUID(),
      ticketId: DEMO_TICKET_RESOLVED_ID,
      updateType: "status_change",
      previousStatus: "in_progress",
      newStatus: "closed",
      comment: "Trabajo completado. El aire acondicionado funciona correctamente.",
      isInternal: false,
      updatedByRole: "owner",
    });
    console.log("✓ Created ticket updates\n");

    // 10. Create portal messages
    console.log("💬 Creating portal messages...");
    
    const msg1Date = new Date(now);
    msg1Date.setDate(msg1Date.getDate() - 3);
    
    await db.insert(portalMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      senderRole: "tenant",
      senderTokenId: DEMO_TENANT_TOKEN_ID,
      senderName: "Inquilino Demo TRH",
      messageType: "user",
      content: "Hola, quería reportar que encontré una fuga de agua en el baño. Ya creé un ticket de mantenimiento.",
      isInternal: false,
      readByTenant: true,
      readByOwner: true,
    });

    await db.insert(portalMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      senderRole: "owner",
      senderTokenId: DEMO_OWNER_TOKEN_ID,
      senderName: "Propietario Demo TRH",
      messageType: "user",
      content: "Gracias por reportarlo. Ya vi el ticket y contacté al plomero. Pasará mañana en la mañana.",
      isInternal: false,
      readByTenant: true,
      readByOwner: true,
    });

    await db.insert(portalMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      senderRole: "owner",
      senderTokenId: DEMO_OWNER_TOKEN_ID,
      senderName: "Propietario Demo TRH",
      messageType: "user",
      content: "NOTA INTERNA: El plomero cobra $2,500 por este tipo de reparación. Autorizar pago.",
      isInternal: true,
      readByTenant: false,
      readByOwner: true,
    });

    await db.insert(portalMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      senderRole: "tenant",
      senderTokenId: DEMO_TENANT_TOKEN_ID,
      senderName: "Inquilino Demo TRH",
      messageType: "user",
      content: "Perfecto, estaré en casa de 9am a 1pm. Gracias por la pronta respuesta!",
      isInternal: false,
      readByTenant: true,
      readByOwner: false,
    });
    console.log("✓ Created portal messages (including internal)\n");

    // 11. Create chat messages with AI
    console.log("🤖 Creating AI chat messages...");
    
    await db.insert(externalPortalChatMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "tenant",
      tokenId: DEMO_TENANT_TOKEN_ID,
      messageType: "user",
      content: "¿Cuándo vence el pago de renta de este mes?",
    });

    await db.insert(externalPortalChatMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "tenant",
      tokenId: DEMO_TENANT_TOKEN_ID,
      messageType: "assistant",
      content: "El pago de renta vence el día 1 de cada mes. Tu renta mensual es de $25,000 MXN. Puedes realizar el pago por transferencia bancaria a la cuenta de Tulum Rental Homes. ¿Te gustaría que te envíe los datos bancarios?",
    });

    await db.insert(externalPortalChatMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "tenant",
      tokenId: DEMO_TENANT_TOKEN_ID,
      messageType: "user",
      content: "¿Puedo tener una mascota en el departamento?",
    });

    await db.insert(externalPortalChatMessages).values({
      id: crypto.randomUUID(),
      agencyId: AGENCY_ID,
      contractId: DEMO_CONTRACT_ID,
      role: "tenant",
      tokenId: DEMO_TENANT_TOKEN_ID,
      messageType: "assistant",
      content: "Sí, tu contrato permite mascotas. De hecho, ya tienes registrada a Luna, tu perrita french poodle. Si deseas agregar otra mascota, por favor notifica al propietario a través del sistema de mensajes.",
    });
    console.log("✓ Created AI chat messages\n");

    // Final summary
    console.log("=".repeat(60));
    console.log("✅ DEMO DATA SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📋 CREDENCIALES DE ACCESO:\n");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ INQUILINO (Tenant)                                      │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ Email:    demo.inquilino@homesapp.com                   │");
    console.log("│ Password: " + DEMO_PASSWORD.padEnd(45) + "│");
    console.log("│ Código Portal: " + tenantAccessCode.padEnd(40) + "│");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ URL Login: /portal                                      │");
    console.log("│ Portal URL: /portal/tenant                              │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ PROPIETARIO (Owner)                                     │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ Email:    demo.propietario@homesapp.com                 │");
    console.log("│ Password: " + DEMO_PASSWORD.padEnd(45) + "│");
    console.log("│ Código Portal: " + ownerAccessCode.padEnd(40) + "│");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ URL Login: /portal                                      │");
    console.log("│ Portal URL: /portal/owner                               │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("");
    console.log("📌 NOTAS:");
    console.log("- Ambos usuarios comparten el mismo contrato de prueba");
    console.log("- La propiedad es: Departamento Demo - Aldea Zama");
    console.log("- Renta mensual: $25,000 MXN");
    console.log("- Hay pagos verificados, pendientes y vencidos para probar");
    console.log("- Hay tickets de mantenimiento abiertos y resueltos");
    console.log("- Hay mensajes de chat con el asistente IA");
    console.log("");

  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  }
}

// Run the seed
seedDemoData()
  .then(() => {
    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
