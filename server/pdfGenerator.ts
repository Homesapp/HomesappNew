import PDFDocument from 'pdfkit';

export async function generateOfferPDF(offerData: any, property: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#3b82f6';
      const secondaryColor = '#64748b';
      const accentColor = '#10b981';
      const bgColor = '#f8fafc';
      const borderColor = '#e2e8f0';

      // Header with background
      doc.rect(0, 0, 595, 120)
        .fillColor('#1e40af')
        .fill();

      doc.fontSize(32)
        .fillColor('#ffffff')
        .text('HomesApp', 50, 35);

      doc.fontSize(14)
        .fillColor('#bfdbfe')
        .text('Tulum Rental Homes ™', 50, 75);

      // Title Section
      doc.fontSize(24)
        .fillColor('#1e293b')
        .text('Oferta de Renta', 50, 150);

      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`Generada el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, 185);

      doc.moveTo(50, 210)
        .lineTo(545, 210)
        .strokeColor(borderColor)
        .lineWidth(2)
        .stroke();

      let yPosition = 230;

      // Property Section with background box
      doc.rect(50, yPosition - 5, 495, 90)
        .fillColor(bgColor)
        .fill();

      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('PROPIEDAD', 60, yPosition + 5);
      
      yPosition += 30;
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(`${property.title || 'Sin título'}`, 60, yPosition);
      
      yPosition += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(`${property.address || 'Dirección no disponible'}`, 60, yPosition);

      if (property.monthlyRentPrice) {
        yPosition += 18;
        doc.fontSize(10)
          .fillColor(secondaryColor)
          .text('Renta mensual solicitada: ', 60, yPosition, { continued: true })
          .fontSize(11)
          .fillColor(accentColor)
          .font('Helvetica-Bold')
          .text(`$${property.monthlyRentPrice.toLocaleString()} ${property.currency || 'USD'}`);
        doc.font('Helvetica');
      }

      yPosition += 50;

      // Client Information Section
      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('INFORMACIÓN DEL SOLICITANTE', 50, yPosition);

      yPosition += 25;
      const clientInfo = [
        { label: 'Nombre completo', value: offerData.fullName },
        { label: 'Email', value: offerData.email },
        { label: 'Teléfono', value: offerData.phone },
        { label: 'Nacionalidad', value: offerData.nationality },
        { label: 'Ocupación', value: offerData.occupation },
      ];

      clientInfo.forEach(({ label, value }) => {
        if (value) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text(`${label}:`, 50, yPosition);
          
          doc.fontSize(10)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(value, 180, yPosition);
          
          doc.font('Helvetica');
          yPosition += 20;
        }
      });

      yPosition += 15;

      // Offer Details Section with highlight box
      doc.rect(50, yPosition - 5, 495, 120)
        .fillColor('#ecfdf5')
        .fill();

      doc.fontSize(16)
        .fillColor(accentColor)
        .text('DETALLES DE LA OFERTA', 60, yPosition + 5);

      yPosition += 30;
      const offerDetails = [
        { 
          label: 'Renta mensual ofertada', 
          value: offerData.monthlyRent ? `$${parseFloat(offerData.monthlyRent).toLocaleString()} ${offerData.currency || 'USD'}` : 'No especificado',
          highlight: true
        },
        { label: 'Tipo de uso', value: offerData.usageType === 'vivienda' ? 'Vivienda' : 'Subarrendamiento' },
        { label: 'Duración del contrato', value: offerData.contractDuration || 'No especificado' },
        { label: 'Fecha de ingreso', value: offerData.moveInDate ? new Date(offerData.moveInDate).toLocaleDateString('es-MX') : 'No especificada' },
        { label: 'Número de ocupantes', value: offerData.numberOfOccupants || 'No especificado' },
      ];

      offerDetails.forEach(({ label, value, highlight }) => {
        doc.fontSize(9)
          .fillColor(secondaryColor)
          .text(`${label}:`, 60, yPosition);
        
        doc.fontSize(highlight ? 12 : 10)
          .fillColor(highlight ? accentColor : '#1e293b')
          .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, 200, yPosition - (highlight ? 1 : 0));
        
        doc.font('Helvetica');
        yPosition += 20;
      });

      yPosition += 20;

      // Services Section
      if ((offerData.offeredServices && offerData.offeredServices.length > 0) || 
          (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0)) {
        
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('SERVICIOS', 50, yPosition);

        yPosition += 25;

        if (offerData.offeredServices && offerData.offeredServices.length > 0) {
          doc.fontSize(11)
            .fillColor(secondaryColor)
            .text('Servicios que el cliente ofrece pagar:', 50, yPosition);
          
          yPosition += 18;
          offerData.offeredServices.forEach((service: string) => {
            doc.fontSize(10)
              .fillColor('#1e293b')
              .text(`✓ ${service}`, 70, yPosition);
            yPosition += 16;
          });
          yPosition += 10;
        }

        if (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0) {
          doc.fontSize(11)
            .fillColor(secondaryColor)
            .text('Servicios requeridos por el propietario:', 50, yPosition);
          
          yPosition += 18;
          offerData.propertyRequiredServices.forEach((service: string) => {
            doc.fontSize(10)
              .fillColor('#1e293b')
              .text(`• ${service}`, 70, yPosition);
            yPosition += 16;
          });
        }

        yPosition += 15;
      }

      // Pets Section
      if (offerData.pets) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('MASCOTAS', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .text(offerData.pets === 'yes' ? 'Sí, tiene mascotas' : 'No tiene mascotas', 50, yPosition);
        
        doc.font('Helvetica');
        
        if (offerData.pets === 'yes' && offerData.petDetails) {
          yPosition += 20;
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text('Detalles:', 50, yPosition);
          yPosition += 16;
          doc.fontSize(10)
            .fillColor('#1e293b')
            .text(offerData.petDetails, 50, yPosition, { width: 495 });
          yPosition += Math.ceil(offerData.petDetails.length / 80) * 14 + 10;
        }

        yPosition += 15;
      }

      // Additional Comments
      if (offerData.additionalComments) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('COMENTARIOS ADICIONALES', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .text(offerData.additionalComments, 50, yPosition, { width: 495 });
      }

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor('#f1f5f9')
        .fill();

      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Este documento es una oferta de renta generada automáticamente por HomesApp.',
          50,
          doc.page.height - 45,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          'HomesApp se reserva el derecho de aprobar o rechazar ofertas según políticas internas.',
          50,
          doc.page.height - 25,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// PDF Template Styles Configuration
const PDF_TEMPLATES = {
  professional: {
    primary: '#2F2A1F',      // Dark brown
    secondary: '#4F4A40',    // Medium brown
    accent: '#C19A6B',       // Gold/tan
    surface: '#F7F4EF',      // Light beige
    border: '#DED6C3',       // Light tan border
    text: '#1a1a1a',
    textSecondary: '#666666',
  },
  modern: {
    primary: '#1a2332',      // Dark slate
    secondary: '#2d3e50',    // Medium slate
    accent: '#7C9CBF',       // Soft blue
    surface: '#F5F7FA',      // Light gray-blue
    border: '#D5DBE1',       // Light slate border
    text: '#1a1a1a',
    textSecondary: '#4a5568',
  },
  elegant: {
    primary: '#2C1810',      // Deep espresso
    secondary: '#5D4E37',    // Coffee brown
    accent: '#A0826D',       // Muted rose gold
    surface: '#FAF8F5',      // Off-white
    border: '#E8DED2',       // Warm beige border
    text: '#1a1a1a',
    textSecondary: '#6b5d54',
  },
};

type TemplateStyle = keyof typeof PDF_TEMPLATES;

// Helper: Load image from URL as buffer
async function loadImageFromUrl(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Failed to load logo image:', error);
    return null;
  }
}

// Helper: Draw dual logos (HomesApp + Agency) - synchronous version with pre-loaded buffer
function drawDualLogos(
  doc: any,
  yPos: number,
  agencyName: string,
  logoBuffer: Buffer | null,
  colors: typeof PDF_TEMPLATES.professional
): number {
  // HomesApp logo (left)
  doc.fontSize(20)
    .fillColor(colors.primary)
    .font('Helvetica-Bold')
    .text('HomesApp', 50, yPos);
  
  doc.fontSize(9)
    .fillColor(colors.textSecondary)
    .font('Helvetica')
    .text('Tulum Rental Homes ™', 50, yPos + 24);

  // Agency branding (right)
  if (agencyName) {
    // Try to render agency logo if buffer is available
    if (logoBuffer) {
      try {
        // Add logo image on the right side (max width: 80px, max height: 40px)
        doc.image(logoBuffer, 465, yPos, { 
          fit: [80, 40],
          align: 'right',
          valign: 'top'
        });
      } catch (imgError) {
        // Fallback to text if image fails to render
        console.error('Failed to render logo image:', imgError);
        doc.fontSize(16)
          .fillColor(colors.primary)
          .font('Helvetica-Bold')
          .text(agencyName, 400, yPos, { align: 'right', width: 145 });
      }
    } else {
      // No logo buffer, use text branding
      doc.fontSize(16)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(agencyName, 400, yPos, { align: 'right', width: 145 });
    }
    
    doc.fontSize(9)
      .fillColor(colors.textSecondary)
      .font('Helvetica')
      .text('Agencia Inmobiliaria', 400, yPos + 22, { align: 'right', width: 145 });
  }

  return yPos + 50;
}

// Helper: Draw section header
function drawSectionHeader(
  doc: any,
  title: string,
  yPos: number,
  colors: typeof PDF_TEMPLATES.professional,
  withBackground: boolean = false
): number {
  if (withBackground) {
    doc.rect(50, yPos - 5, 495, 28)
      .fillColor(colors.surface)
      .fill();
  }

  doc.fontSize(14)
    .fillColor(colors.primary)
    .font('Helvetica-Bold')
    .text(title, 55, yPos);
  
  doc.font('Helvetica');
  return yPos + 30;
}

// Helper: Draw key-value grid (2 columns)
function drawKeyValueGrid(
  doc: any,
  items: Array<{ label: string; value: string | null | undefined }>,
  yPos: number,
  colors: typeof PDF_TEMPLATES.professional
): number {
  let currentY = yPos;
  
  items.forEach(({ label, value }) => {
    if (value) {
      // Check if we need a new page
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(8)
        .fillColor(colors.textSecondary)
        .text(`${label}:`, 60, currentY);
      
      doc.fontSize(10)
        .fillColor(colors.text)
        .font('Helvetica-Bold')
        .text(String(value), 200, currentY, { width: 335 });
      
      doc.font('Helvetica');
      currentY += 18;
    }
  });
  
  return currentY + 10;
}

// Helper: Draw document list
function drawDocumentList(
  doc: any,
  title: string,
  documents: Array<{ label: string; url: string | string[] | null | undefined }>,
  yPos: number,
  colors: typeof PDF_TEMPLATES.professional
): number {
  let currentY = yPos;

  // Check if we need a new page
  if (currentY > 680) {
    doc.addPage();
    currentY = 50;
  }

  doc.fontSize(12)
    .fillColor(colors.secondary)
    .font('Helvetica-Bold')
    .text(title, 60, currentY);
  
  currentY += 20;
  doc.font('Helvetica');

  let hasDocuments = false;
  documents.forEach(({ label, url }) => {
    if (url) {
      hasDocuments = true;
      const urls = Array.isArray(url) ? url : [url];
      urls.forEach((u, idx) => {
        if (u) {
          doc.fontSize(9)
            .fillColor(colors.text)
            .text(`• ${label}${urls.length > 1 ? ` (${idx + 1})` : ''}: `, 70, currentY);
          
          doc.fontSize(8)
            .fillColor(colors.accent)
            .text('Documento adjunto', 180, currentY);
          
          currentY += 16;
        }
      });
    }
  });

  if (!hasDocuments) {
    doc.fontSize(9)
      .fillColor(colors.textSecondary)
      .text('No se adjuntaron documentos', 70, currentY);
    currentY += 16;
  }

  return currentY + 15;
}

// Helper: Draw signature block
function drawSignatureBlock(
  doc: any,
  name: string,
  signatureUrl: string | null | undefined,
  yPos: number,
  colors: typeof PDF_TEMPLATES.professional
): number {
  let currentY = yPos;

  // Check if we need a new page
  if (currentY > 680) {
    doc.addPage();
    currentY = 50;
  }

  doc.fontSize(10)
    .fillColor(colors.text)
    .font('Helvetica-Bold')
    .text(name, 60, currentY);
  
  currentY += 20;
  doc.font('Helvetica');

  if (signatureUrl) {
    doc.fontSize(8)
      .fillColor(colors.accent)
      .text('✓ Firmado digitalmente', 60, currentY);
    currentY += 15;
    doc.fontSize(7)
      .fillColor(colors.textSecondary)
      .text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 60, currentY);
  } else {
    doc.fontSize(8)
      .fillColor(colors.textSecondary)
      .text('Firma pendiente', 60, currentY);
  }

  // Signature line
  doc.moveTo(60, currentY + 40)
    .lineTo(260, currentY + 40)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();
  
  doc.fontSize(7)
    .fillColor(colors.textSecondary)
    .text('Firma', 60, currentY + 45);

  return currentY + 70;
}

export async function generateRentalFormPDF(
  tenantData: any,
  property: any,
  agencyName: string = '',
  agencyLogoUrl: string | null = null,
  templateStyle: TemplateStyle = 'professional'
): Promise<Buffer> {
  // Pre-load agency logo if URL is provided
  const logoBuffer = agencyLogoUrl ? await loadImageFromUrl(agencyLogoUrl) : null;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const colors = PDF_TEMPLATES[templateStyle] || PDF_TEMPLATES.professional;

      // Header with dual logos
      let yPosition = 40;
      yPosition = drawDualLogos(doc, yPosition, agencyName, logoBuffer, colors);

      // Title
      doc.fontSize(22)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text('Formulario de Solicitud de Arrendamiento', 50, yPosition, { align: 'center', width: 495 });
      
      yPosition += 35;
      doc.fontSize(9)
        .fillColor(colors.textSecondary)
        .font('Helvetica')
        .text(`Generado el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, yPosition, { align: 'center', width: 495 });

      yPosition += 25;
      doc.moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .strokeColor(colors.border)
        .lineWidth(1)
        .stroke();

      yPosition += 25;

      // Property Section
      yPosition = drawSectionHeader(doc, 'PROPIEDAD', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Propiedad', value: property.title || 'Sin título' },
        { label: 'Dirección', value: property.address || 'No disponible' },
        { label: 'Ciudad', value: property.city || 'Tulum' },
        { label: 'Estado', value: property.state || 'Quintana Roo' },
      ], yPosition, colors);

      // Tenant Personal Information
      yPosition = drawSectionHeader(doc, 'INFORMACIÓN PERSONAL DEL INQUILINO', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Nombre completo', value: tenantData.fullName },
        { label: 'Email', value: tenantData.email },
        { label: 'Teléfono', value: tenantData.phone },
        { label: 'Fecha de nacimiento', value: tenantData.birthDate ? new Date(tenantData.birthDate).toLocaleDateString('es-MX') : null },
        { label: 'Nacionalidad', value: tenantData.nationality },
        { label: 'Estatus laboral', value: tenantData.employmentStatus },
        { label: 'Ingreso mensual', value: tenantData.monthlyIncome ? `$${parseFloat(tenantData.monthlyIncome).toLocaleString()} USD` : null },
        { label: 'Empresa', value: tenantData.employerName },
        { label: 'Mascotas', value: tenantData.hasPets === 'yes' ? 'Sí' : 'No' },
        { label: 'Vehículo', value: tenantData.hasVehicle === 'yes' ? 'Sí' : 'No' },
      ], yPosition, colors);

      // Tenant Documents
      yPosition = drawDocumentList(doc, 'Documentos del Inquilino', [
        { label: 'INE/Pasaporte', url: tenantData.tenantIdDocument },
        { label: 'Comprobante de domicilio', url: tenantData.tenantProofOfAddress },
        { label: 'Comprobante de ingresos', url: tenantData.tenantProofOfIncome },
      ], yPosition, colors);

      // Guarantor Information
      if (tenantData.guarantorFullName) {
        yPosition = drawSectionHeader(doc, 'INFORMACIÓN DEL AVAL', yPosition, colors, true);
        yPosition = drawKeyValueGrid(doc, [
          { label: 'Nombre completo', value: tenantData.guarantorFullName },
          { label: 'Email', value: tenantData.guarantorEmail },
          { label: 'Teléfono', value: tenantData.guarantorPhone },
          { label: 'Relación', value: tenantData.guarantorRelationship },
          { label: 'Empresa', value: tenantData.guarantorEmployerName },
          { label: 'Ingreso mensual', value: tenantData.guarantorMonthlyIncome ? `$${parseFloat(tenantData.guarantorMonthlyIncome).toLocaleString()} USD` : null },
        ], yPosition, colors);

        // Guarantor Documents
        yPosition = drawDocumentList(doc, 'Documentos del Aval', [
          { label: 'INE/Pasaporte', url: tenantData.guarantorIdDocument },
          { label: 'Comprobante de domicilio', url: tenantData.guarantorProofOfAddress },
          { label: 'Comprobante de ingresos', url: tenantData.guarantorProofOfIncome },
        ], yPosition, colors);
      }

      // References
      if (tenantData.references && tenantData.references.length > 0) {
        yPosition = drawSectionHeader(doc, 'REFERENCIAS', yPosition, colors, true);
        tenantData.references.forEach((ref: any, index: number) => {
          yPosition = drawKeyValueGrid(doc, [
            { label: `Referencia ${index + 1}`, value: ref.name },
            { label: 'Teléfono', value: ref.phone },
            { label: 'Relación', value: ref.relationship },
          ], yPosition, colors);
        });
      }

      // Signatures Section
      doc.addPage();
      yPosition = 50;
      yPosition = drawSectionHeader(doc, 'FIRMAS Y DECLARACIONES', yPosition, colors, true);
      yPosition += 10;

      yPosition = drawSignatureBlock(doc, 'Inquilino: ' + (tenantData.fullName || ''), tenantData.digitalSignature, yPosition, colors);
      
      if (tenantData.guarantorFullName) {
        yPosition = drawSignatureBlock(doc, 'Aval: ' + tenantData.guarantorFullName, tenantData.guarantorDigitalSignature, yPosition, colors);
      }

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor(colors.surface)
        .fill();

      doc.fontSize(7)
        .fillColor(colors.textSecondary)
        .text(
          'Este documento es una solicitud de arrendamiento generada automáticamente.',
          50,
          doc.page.height - 40,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateOwnerFormPDF(
  ownerData: any,
  property: any,
  agencyName: string = '',
  agencyLogoUrl: string | null = null,
  templateStyle: TemplateStyle = 'professional'
): Promise<Buffer> {
  // Pre-load agency logo if URL is provided
  const logoBuffer = agencyLogoUrl ? await loadImageFromUrl(agencyLogoUrl) : null;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const colors = PDF_TEMPLATES[templateStyle] || PDF_TEMPLATES.professional;

      // Header with dual logos
      let yPosition = 40;
      yPosition = drawDualLogos(doc, yPosition, agencyName, logoBuffer, colors);

      // Title
      doc.fontSize(22)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text('Formulario de Propietario (Arrendador)', 50, yPosition, { align: 'center', width: 495 });
      
      yPosition += 35;
      doc.fontSize(9)
        .fillColor(colors.textSecondary)
        .font('Helvetica')
        .text(`Generado el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, yPosition, { align: 'center', width: 495 });

      yPosition += 25;
      doc.moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .strokeColor(colors.border)
        .lineWidth(1)
        .stroke();

      yPosition += 25;

      // Property Section
      yPosition = drawSectionHeader(doc, 'PROPIEDAD', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Propiedad', value: property.title || 'Sin título' },
        { label: 'Dirección', value: property.address || 'No disponible' },
        { label: 'Subdivisión', value: ownerData.subdivision },
        { label: 'Número de unidad', value: ownerData.unitNumber },
      ], yPosition, colors);

      // Owner Personal Information
      yPosition = drawSectionHeader(doc, 'INFORMACIÓN PERSONAL DEL PROPIETARIO', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Nombre completo', value: ownerData.fullName },
        { label: 'Nacionalidad', value: ownerData.nationality },
        { label: 'Teléfono', value: ownerData.phoneNumber },
        { label: 'WhatsApp', value: ownerData.whatsappNumber },
        { label: 'Email', value: ownerData.email },
        { label: 'Permite subarrendamiento', value: ownerData.subleasingAllowed ? 'Sí' : 'No' },
      ], yPosition, colors);

      // Property Details
      yPosition = drawSectionHeader(doc, 'DETALLES DE LA RENTA', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Renta mensual acordada', value: ownerData.agreedRent ? `$${parseFloat(ownerData.agreedRent).toLocaleString()} MXN` : null },
        { label: 'Depósito de garantía', value: ownerData.agreedDeposit ? `$${parseFloat(ownerData.agreedDeposit).toLocaleString()} MXN` : null },
        { label: 'Fecha de entrada', value: ownerData.moveInDate ? new Date(ownerData.moveInDate).toLocaleDateString('es-MX') : null },
        { label: 'Duración del contrato', value: ownerData.contractDuration },
        { label: 'Permite mascotas', value: ownerData.petsAllowed ? 'Sí' : 'No' },
      ], yPosition, colors);

      // Bank Information
      yPosition = drawSectionHeader(doc, 'INFORMACIÓN BANCARIA', yPosition, colors, true);
      yPosition = drawKeyValueGrid(doc, [
        { label: 'Nombre del banco', value: ownerData.bankName },
        { label: 'CLABE interbancaria', value: ownerData.interbankCode },
        { label: 'Número de cuenta/tarjeta', value: ownerData.accountOrCardNumber },
        { label: 'Nombre del titular', value: ownerData.accountHolderName },
        { label: 'Código SWIFT', value: ownerData.swiftCode },
        { label: 'Dirección del banco', value: ownerData.bankAddress },
        { label: 'Email del banco', value: ownerData.bankEmail },
      ], yPosition, colors);

      // Special Notes
      if (ownerData.specialNotes) {
        yPosition = drawSectionHeader(doc, 'NOTAS ESPECIALES', yPosition, colors, true);
        doc.fontSize(9)
          .fillColor(colors.textPrimary)
          .font('Helvetica')
          .text(ownerData.specialNotes, 60, yPosition, { width: 475, align: 'left' });
        yPosition += Math.ceil(doc.heightOfString(ownerData.specialNotes, { width: 475 })) + 20;
      }

      // Owner Documents - New Page
      doc.addPage();
      yPosition = 50;
      yPosition = drawSectionHeader(doc, 'DOCUMENTOS DEL PROPIETARIO', yPosition, colors, true);
      yPosition += 10;

      const ownerDocuments = [
        { label: 'Identificación oficial', url: ownerData.idDocumentUrl },
        { label: 'Acta constitutiva', url: ownerData.constitutiveActUrl },
        { label: 'Formato de servicios', url: ownerData.servicesFormatUrl },
        { label: 'Reglamento interno', url: ownerData.internalRulesUrl },
        { label: 'Reglamento del condominio', url: ownerData.condoRegulationsUrl },
      ];

      // Add arrays for multiple documents
      if (ownerData.propertyDocumentsUrls && ownerData.propertyDocumentsUrls.length > 0) {
        ownerData.propertyDocumentsUrls.forEach((url: string, index: number) => {
          ownerDocuments.push({ 
            label: `Documento de propiedad ${index + 1}`, 
            url 
          });
        });
      }

      if (ownerData.serviceReceiptsUrls && ownerData.serviceReceiptsUrls.length > 0) {
        ownerData.serviceReceiptsUrls.forEach((url: string, index: number) => {
          ownerDocuments.push({ 
            label: `Recibo de servicio ${index + 1}`, 
            url 
          });
        });
      }

      if (ownerData.noDebtProofUrls && ownerData.noDebtProofUrls.length > 0) {
        ownerData.noDebtProofUrls.forEach((url: string, index: number) => {
          ownerDocuments.push({ 
            label: `Comprobante de no adeudo ${index + 1}`, 
            url 
          });
        });
      }

      yPosition = drawDocumentList(doc, '', ownerDocuments, yPosition, colors);

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor(colors.surface)
        .fill();

      doc.fontSize(7)
        .fillColor(colors.textSecondary)
        .text(
          'Este documento es un formulario de propietario generado automáticamente.',
          50,
          doc.page.height - 40,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateQuotationPDF(
  quotationData: any, 
  agencyData?: { name?: string; logo?: string; contact?: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 40, right: 40 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#1e40af';
      const textColor = '#1e293b';
      const mutedColor = '#64748b';
      const accentColor = '#10b981';
      const bgLight = '#f8fafc';

      // Compact header bar
      doc.rect(0, 0, 595, 70).fillColor(primaryColor).fill();

      // HomesApp branding (left)
      doc.fontSize(20).fillColor('#ffffff').text('HomesApp', 40, 20);
      doc.fontSize(8).fillColor('#bfdbfe').text('Tulum Rental Homes', 40, 45);

      // Agency branding (right)
      if (agencyData?.name) {
        doc.fontSize(11).fillColor('#ffffff').text(agencyData.name, 350, 25, { width: 205, align: 'right' });
        if (agencyData.contact) {
          doc.fontSize(7).fillColor('#bfdbfe').text(agencyData.contact, 350, 42, { width: 205, align: 'right' });
        }
      }

      let y = 85;

      // Title + Metadata row
      doc.fontSize(16).fillColor(textColor).font('Helvetica-Bold').text('COTIZACION DE MANTENIMIENTO', 40, y);
      doc.font('Helvetica');

      // Quotation number & date on same line (right aligned)
      const quotationNumber = quotationData.sequenceNumber 
        ? `#${String(quotationData.sequenceNumber).padStart(7, '0')}`
        : `#${quotationData.id?.slice(0, 8) || 'N/A'}`;
      const dateStr = new Date(quotationData.createdAt || Date.now()).toLocaleDateString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric'
      });
      doc.fontSize(8).fillColor(mutedColor).text(`No. ${quotationNumber}  |  ${dateStr}`, 350, y + 4, { width: 205, align: 'right' });

      y += 25;

      // Status + Created by + Unit in single compact row
      const statusLabels: Record<string, string> = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' };
      const statusColors: Record<string, string> = { draft: mutedColor, sent: primaryColor, approved: accentColor, rejected: '#ef4444', cancelled: mutedColor };
      const status = quotationData.status || 'draft';
      
      doc.fontSize(8).fillColor(statusColors[status] || mutedColor).font('Helvetica-Bold').text(statusLabels[status] || status, 40, y);
      doc.font('Helvetica');

      let infoX = 120;
      if (quotationData.createdByName) {
        doc.fontSize(7).fillColor(mutedColor).text(`Por: ${quotationData.createdByName}`, infoX, y);
        infoX += 130;
      }
      if (quotationData.unitName) {
        doc.fontSize(7).fillColor(mutedColor).text(`Unidad: ${quotationData.unitName}`, infoX, y);
      }

      y += 18;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      y += 12;

      // Client info (compact inline if present)
      if (quotationData.clientName) {
        doc.rect(40, y, 515, 30).fillColor(bgLight).fill();
        doc.fontSize(8).fillColor(primaryColor).font('Helvetica-Bold').text('CLIENTE', 50, y + 5);
        doc.font('Helvetica').fontSize(8).fillColor(textColor);
        let clientText = quotationData.clientName;
        if (quotationData.clientEmail) clientText += `  |  ${quotationData.clientEmail}`;
        if (quotationData.clientPhone) clientText += `  |  ${quotationData.clientPhone}`;
        doc.text(clientText, 50, y + 17, { width: 495 });
        y += 38;
      }

      // Description (compact)
      if (quotationData.description) {
        doc.fontSize(8).fillColor(primaryColor).font('Helvetica-Bold').text('DESCRIPCION', 40, y);
        doc.font('Helvetica').fontSize(8).fillColor(textColor);
        y += 12;
        const descText = quotationData.description.substring(0, 200) + (quotationData.description.length > 200 ? '...' : '');
        doc.text(descText, 40, y, { width: 515 });
        const descHeight = doc.heightOfString(descText, { width: 515 });
        y += descHeight + 12;
      }

      // Services table (compact)
      doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text('SERVICIOS', 40, y);
      y += 15;

      // Table header
      doc.rect(40, y, 515, 20).fillColor(primaryColor).fill();
      doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('DESCRIPCION', 50, y + 6, { width: 220 });
      doc.text('CANT.', 275, y + 6, { width: 40, align: 'center' });
      doc.text('P. UNIT.', 320, y + 6, { width: 70, align: 'right' });
      doc.text('SUBTOTAL', 400, y + 6, { width: 145, align: 'right' });
      doc.font('Helvetica');
      y += 20;

      // Service rows (compact - all services)
      const services = quotationData.services || [];
      const rowHeight = services.length > 12 ? 14 : 16;
      const fontSize = services.length > 12 ? 6 : 7;
      
      services.forEach((service: any, index: number) => {
        // Check if we need a new page
        if (y > 720) {
          doc.addPage();
          y = 40;
          // Re-render table header
          doc.rect(40, y, 515, 18).fillColor(primaryColor).fill();
          doc.fontSize(6).fillColor('#ffffff').font('Helvetica-Bold');
          doc.text('DESCRIPCION', 50, y + 5, { width: 220 });
          doc.text('CANT.', 275, y + 5, { width: 40, align: 'center' });
          doc.text('P. UNIT.', 320, y + 5, { width: 70, align: 'right' });
          doc.text('SUBTOTAL', 400, y + 5, { width: 145, align: 'right' });
          doc.font('Helvetica');
          y += 18;
        }
        
        const rowBg = index % 2 === 0 ? bgLight : '#ffffff';
        doc.rect(40, y, 515, rowHeight).fillColor(rowBg).fill();
        
        const subtotal = service.subtotal ?? ((service.quantity || 0) * (service.unitPrice || 0));
        const serviceDesc = (service.name || service.description || 'Sin descripcion').substring(0, 45);
        
        doc.fontSize(fontSize).fillColor(textColor);
        doc.text(serviceDesc, 50, y + 3, { width: 220 });
        doc.text(String(service.quantity || 0), 275, y + 3, { width: 40, align: 'center' });
        doc.fillColor(mutedColor).text(`$${(service.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 320, y + 3, { width: 70, align: 'right' });
        doc.fillColor(textColor).font('Helvetica-Bold').text(`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 400, y + 3, { width: 145, align: 'right' });
        doc.font('Helvetica');
        y += rowHeight;
      });

      y += 6;

      // Check if we need new page for financials
      if (y > 700) {
        doc.addPage();
        y = 40;
      }

      // Financials (compact box aligned right)
      const calculatedSubtotal = services.reduce((sum: number, s: any) => sum + Number(s.subtotal ?? (s.quantity || 0) * (s.unitPrice || 0)), 0);
      const subtotalValue = Number(quotationData.subtotal) || calculatedSubtotal;
      const adminFeePercentageValue = Number(quotationData.adminFeePercentage) || 15;
      const adminFeeValue = Number(quotationData.adminFee) || (subtotalValue * adminFeePercentageValue / 100);
      const totalValue = Number(quotationData.total) || (subtotalValue + adminFeeValue);
      const currency = quotationData.currency || 'MXN';

      doc.rect(350, y, 205, 55).fillColor('#ecfdf5').fill();
      
      doc.fontSize(7).fillColor(mutedColor).text('Subtotal:', 360, y + 6);
      doc.text(`$${subtotalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 450, y + 6, { width: 95, align: 'right' });
      doc.fontSize(6).fillColor(mutedColor).text(`Tarifa admin. (${adminFeePercentageValue}%):`, 360, y + 18);
      doc.fillColor('#f59e0b').text(`$${adminFeeValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 450, y + 18, { width: 95, align: 'right' });
      
      doc.moveTo(360, y + 32).lineTo(545, y + 32).strokeColor(accentColor).lineWidth(1).stroke();
      doc.fontSize(9).fillColor(mutedColor).text('TOTAL:', 360, y + 38);
      doc.fontSize(11).fillColor(accentColor).font('Helvetica-Bold').text(`$${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`, 430, y + 36, { width: 115, align: 'right' });
      doc.font('Helvetica');

      y += 60;

      // Terms (compact, if space allows)
      if (quotationData.terms && y < 720) {
        doc.fontSize(7).fillColor(primaryColor).font('Helvetica-Bold').text('TERMINOS Y CONDICIONES', 40, y);
        doc.font('Helvetica').fontSize(6).fillColor(mutedColor);
        y += 10;
        const maxTermsLength = y > 650 ? 200 : 400;
        const termsText = quotationData.terms.substring(0, maxTermsLength) + (quotationData.terms.length > maxTermsLength ? '...' : '');
        doc.text(termsText, 40, y, { width: 515, align: 'justify' });
        const termsHeight = doc.heightOfString(termsText, { width: 515 });
        y += termsHeight + 8;
      }

      // Footer (dynamic position based on content, at bottom of current page)
      const footerY = Math.max(y + 10, 780);
      doc.rect(0, footerY, 595, 62).fillColor(bgLight).fill();
      doc.fontSize(6).fillColor(mutedColor);
      doc.text('Cotizacion valida por 30 dias.', 40, footerY + 8, { width: 515, align: 'center' });
      doc.text(agencyData?.name ? `${agencyData.name} | Powered by HomesApp` : 'Powered by HomesApp', 40, footerY + 18, { width: 515, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
