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
