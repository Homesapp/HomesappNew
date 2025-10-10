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
      const accentColor = '#f59e0b';

      doc.fontSize(28)
        .fillColor(primaryColor)
        .text('HomesApp', 50, 50);

      doc.fontSize(12)
        .fillColor(secondaryColor)
        .text('Tulum Rental Homes ™', 50, 85);

      doc.moveTo(50, 110)
        .lineTo(545, 110)
        .strokeColor('#e2e8f0')
        .stroke();

      doc.fontSize(20)
        .fillColor('#1e293b')
        .text('Oferta de Renta', 50, 130);

      doc.fontSize(11)
        .fillColor(secondaryColor)
        .text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, 50, 165);

      let yPosition = 200;

      doc.fontSize(14)
        .fillColor(primaryColor)
        .text('Propiedad', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(11)
        .fillColor('#1e293b')
        .text(`${property.title || 'Sin título'}`, 50, yPosition);
      
      yPosition += 20;
      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`${property.address || 'Dirección no disponible'}`, 50, yPosition);

      yPosition += 40;
      doc.fontSize(14)
        .fillColor(primaryColor)
        .text('Información del Solicitante', 50, yPosition);

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
          doc.fontSize(10)
            .fillColor(secondaryColor)
            .text(`${label}:`, 50, yPosition);
          
          doc.fillColor('#1e293b')
            .text(value, 180, yPosition);
          
          yPosition += 18;
        }
      });

      yPosition += 20;
      doc.fontSize(14)
        .fillColor(primaryColor)
        .text('Detalles de la Oferta', 50, yPosition);

      yPosition += 25;
      const offerDetails = [
        { label: 'Renta mensual ofertada', value: offerData.monthlyRent ? `$${offerData.monthlyRent} ${offerData.currency || 'USD'}` : 'No especificado' },
        { label: 'Duración del contrato', value: offerData.contractDuration || 'No especificado' },
        { label: 'Fecha de ingreso deseada', value: offerData.moveInDate ? new Date(offerData.moveInDate).toLocaleDateString('es-MX') : 'No especificada' },
        { label: 'Número de ocupantes', value: offerData.numberOfOccupants || 'No especificado' },
      ];

      offerDetails.forEach(({ label, value }) => {
        doc.fontSize(10)
          .fillColor(secondaryColor)
          .text(`${label}:`, 50, yPosition);
        
        doc.fillColor('#1e293b')
          .text(value, 180, yPosition);
        
        yPosition += 18;
      });

      if (offerData.services && offerData.services.length > 0) {
        yPosition += 20;
        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('Servicios Solicitados', 50, yPosition);

        yPosition += 25;
        offerData.services.forEach((service: string) => {
          doc.fontSize(10)
            .fillColor('#1e293b')
            .text(`• ${service}`, 70, yPosition);
          yPosition += 18;
        });
      }

      if (offerData.pets) {
        yPosition += 20;
        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('Mascotas', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .text(offerData.pets === 'yes' ? 'Sí, tiene mascotas' : 'No tiene mascotas', 50, yPosition);
        
        if (offerData.pets === 'yes' && offerData.petDetails) {
          yPosition += 18;
          doc.fillColor(secondaryColor)
            .text('Detalles:', 50, yPosition);
          yPosition += 18;
          doc.fillColor('#1e293b')
            .text(offerData.petDetails, 50, yPosition, { width: 495 });
          yPosition += 35;
        }
      }

      if (offerData.additionalComments) {
        yPosition += 20;
        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('Comentarios Adicionales', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .text(offerData.additionalComments, 50, yPosition, { width: 495 });
      }

      doc.moveDown(3);
      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Este documento es una oferta de renta generada automáticamente. HomesApp se reserva el derecho de aprobar o rechazar ofertas.',
          50,
          doc.page.height - 80,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
