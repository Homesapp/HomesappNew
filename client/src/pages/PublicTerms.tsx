import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  FileText, 
  Home, 
  User, 
  Building2, 
  Calendar,
  Shield,
  Scale,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import type { ExternalTermsAndConditions } from "@shared/schema";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface PublicTermsProps {
  type: 'tenant' | 'owner' | 'general';
}

const defaultTenantTerms = {
  es: {
    title: "Términos y Condiciones para Inquilinos",
    subtitle: "Condiciones de arrendamiento y responsabilidades del inquilino",
    sections: [
      {
        title: "1. Tiempo de Pagos por Plataformas",
        content: "Entendemos que cada plataforma tiene su tiempo de espera o de transferencia, pero sólo se considera una transferencia como completada, una vez que el dinero efectivamente se ve reflejado en la cuenta destino y el destinatario confirma la recepción. Para bancos y/plataformas nacionales e internacionales, los recibos sólo se usan como referencia pero no tienen validez ni aceptación como prueba para presentar antes de las fechas acordadas. Pasando 5 días de la fecha estipulada, los presentes contratos caducarán y se perderá el depósito del apartado. Esto aplica para transferencias nacionales e internacionales desde plataformas móviles como Wise, Venmo, Zelle, PayPal o cualquier tipo de aplicación de transferencia de dinero nacional o internacional."
      },
      {
        title: "2. Prórrogas de Tiempos de Pago",
        content: "Solamente es válida una prórroga de tiempo mediante un acuerdo mutuo entre las partes y modificando el presente contrato, con al menos 48 hs de anticipación a la fecha designada."
      },
      {
        title: "3. Costos Administrativos",
        content: "Por la elaboración del contrato de arrendamiento los honorarios a cobrar serán: $2,500 MXN para contratos de uso de propiedad para vivienda personal, o $3,800 MXN para contratos de renta para subarrendamiento. La cantidad que corresponda deberá ser abonada en una sola exhibición junto con el monto correspondiente al depósito para el apartado de la unidad."
      },
      {
        title: "4. Reserva de Propiedades",
        content: "Tanto para poder reservar, bloquear fechas y dejar de promocionar la unidad con nuevos clientes, así como para solicitar al estudio jurídico la elaboración del contrato correspondiente, podrá solicitarse depósito para el apartado de la propiedad antes de la fecha de la firma de contrato. Por lo que el promitente arrendatario acepta que para el caso de cancelación de la reservación por causa imputable a él, dicho depósito se constituirá como la penalización derivada de dicha cancelación, por lo que no se hará la devolución del depósito ni del pago del contrato."
      },
      {
        title: "5. Aviso de Privacidad",
        content: "Toda la información recabada será de carácter confidencial y de no divulgación de acuerdo a los Artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de Particulares."
      },
      {
        title: "6. Declaración Jurada de Información Fidedigna",
        content: "Promitente arrendatario y garante, bajo protesta de decir verdad manifiestan que la información proporcionada es verídica, asumiendo así mismo todo tipo de responsabilidad derivada de cualquier declaración en falso sobre las mismas, asegurando que el dinero con el cual será pagado depósito y arrendamiento, no proviene de actividades ilícitas, por lo que autorizamos al propietario del inmueble materia de arrendamiento, a sus asesores inmobiliarios y abogado, a realizar las investigaciones correspondientes para corroborar que la información es fidedigna y a que realice la investigación de incidencias legales correspondiente."
      },
      {
        title: "7. Tolerancia Ambiental y Falla en los Servicios",
        content: "El arrendatario reconoce que, debido a la ubicación geográfica y características naturales de la zona, pueden presentarse fenómenos como humedad excesiva (hongos), aparición de fauna local (insectos, geckos, etc.) o sargazo en zonas cercanas, así como la falla de los servicios básicos como luz, agua e internet, y que estas situaciones no serán consideradas causa de incumplimiento ni para solicitud de compensaciones ni rescisión del contrato."
      },
      {
        title: "8. Cancelación por Causa de Fuerza Comercial",
        content: "En caso de que la propiedad sea puesta en venta y se concrete una oferta de compra formal, el arrendador podrá cancelar el contrato con 60 días de preaviso y sin penalización, reembolsando íntegramente el depósito y cualquier renta pagada por adelantado."
      },
      {
        title: "9. Uso de Áreas Comunes",
        content: "El arrendatario se compromete a cumplir el reglamento del condominio o interno del apartamento, incluyendo horarios de uso de amenidades, normas de convivencia, y uso responsable de áreas como alberca, gimnasio o roof garden. Cualquier multa impuesta por la administración y/o propietario será responsabilidad del arrendatario y posible rescisión del contrato en caso de que adquiera multas reiteradas."
      },
      {
        title: "10. Cambio de Moneda",
        content: "En contratos celebrados con personas de nacionalidad extranjera, los montos establecidos serán definidos en pesos mexicanos (MXN) y deberán ser pagados en la misma moneda en la que se firmó el contrato, utilizando el tipo de cambio vigente al día de la transacción."
      },
      {
        title: "11. Declaración de Idioma y Entendimiento",
        content: "En contratos con personas de nacionalidad extranjera o versiones bilingües se anexará la siguiente cláusula: \"Las partes declaran que han entendido íntegramente el contenido de este contrato en su idioma nativo o idioma de preferencia, y que en caso de discrepancia entre versiones, prevalecerá la versión en español.\""
      },
      {
        title: "12. Tolerancia Acústica Urbana",
        content: "El arrendatario reconoce que el inmueble se ubica en una zona urbana, turística o en desarrollo, por lo que acepta la posibilidad de ruidos ocasionales (tráfico, música, obras) y que estos no constituyen motivo de queja, rescisión ni solicitud de reembolso."
      },
      {
        title: "13. Mantenimientos y Reparaciones",
        content: "A partir de los 30 días posteriores al inicio del contrato de arrendamiento, el inquilino será responsable de realizar el mantenimiento preventivo de los aires acondicionados cada seis (6) meses y/o al momento de su salida (check-out) de la propiedad. Asimismo, será responsable de cubrir cualquier reparación de artículos, electrodomésticos o mobiliario que presente desperfectos no reportados dentro de los primeros 30 días de vigencia del contrato."
      }
    ]
  },
  en: {
    title: "Terms and Conditions for Tenants",
    subtitle: "Lease conditions and tenant responsibilities",
    sections: [
      {
        title: "1. Payment Processing Times",
        content: "We understand that each platform has its own waiting or transfer time, but a transfer is only considered complete once the money is effectively reflected in the destination account and the recipient confirms receipt. For national and international banks/platforms, receipts are only used as reference but have no validity or acceptance as proof before the agreed dates. After 5 days from the stipulated date, these contracts will expire and the reservation deposit will be forfeited. This applies to national and international transfers from mobile platforms such as Wise, Venmo, Zelle, PayPal, or any type of national or international money transfer application."
      },
      {
        title: "2. Payment Time Extensions",
        content: "A time extension is only valid through a mutual agreement between the parties and by modifying this contract, with at least 48 hours in advance of the designated date."
      },
      {
        title: "3. Administrative Costs",
        content: "For the preparation of the lease agreement, the fees to be charged will be: $2,500 MXN for property use contracts for personal housing, or $3,800 MXN for sublease rental contracts. The corresponding amount must be paid in a single payment together with the deposit amount for the unit reservation."
      },
      {
        title: "4. Property Reservation",
        content: "In order to reserve, block dates, and stop promoting the unit to new clients, as well as to request the legal firm to prepare the corresponding contract, a deposit may be requested for the property reservation before the contract signing date. Therefore, the prospective tenant accepts that in case of cancellation of the reservation due to reasons attributable to them, said deposit will constitute the penalty derived from such cancellation, and neither the deposit nor the contract payment will be refunded."
      },
      {
        title: "5. Privacy Notice",
        content: "All information collected will be confidential and non-disclosure in accordance with Articles 15 and 16 of the Federal Law on Protection of Personal Data Held by Private Parties."
      },
      {
        title: "6. Sworn Statement of Accurate Information",
        content: "The prospective tenant and guarantor, under penalty of perjury, declare that the information provided is truthful, assuming all responsibility derived from any false statement, assuring that the money with which the deposit and rent will be paid does not come from illicit activities. Therefore, we authorize the property owner, their real estate advisors, and lawyer to conduct the corresponding investigations to corroborate that the information is accurate and to conduct the corresponding legal incident investigation."
      },
      {
        title: "7. Environmental Tolerance and Service Failures",
        content: "The tenant acknowledges that, due to the geographic location and natural characteristics of the area, phenomena such as excessive humidity (mold), appearance of local fauna (insects, geckos, etc.) or sargassum in nearby areas may occur, as well as failures of basic services such as electricity, water, and internet, and that these situations will not be considered cause for breach nor for requesting compensation or contract termination."
      },
      {
        title: "8. Cancellation Due to Commercial Force Majeure",
        content: "In the event that the property is put up for sale and a formal purchase offer is finalized, the landlord may cancel the contract with 60 days' notice and without penalty, fully reimbursing the deposit and any rent paid in advance."
      },
      {
        title: "9. Use of Common Areas",
        content: "The tenant agrees to comply with the condominium or apartment internal regulations, including schedules for use of amenities, coexistence rules, and responsible use of areas such as the pool, gym, or roof garden. Any fine imposed by the administration and/or owner will be the tenant's responsibility, and possible contract termination in case of repeated fines."
      },
      {
        title: "10. Currency Exchange",
        content: "In contracts entered into with foreign nationals, the established amounts will be defined in Mexican pesos (MXN) and must be paid in the same currency in which the contract was signed, using the exchange rate in effect on the day of the transaction."
      },
      {
        title: "11. Language and Understanding Declaration",
        content: "In contracts with foreign nationals or bilingual versions, the following clause will be attached: \"The parties declare that they have fully understood the content of this contract in their native language or language of preference, and that in case of discrepancy between versions, the Spanish version shall prevail.\""
      },
      {
        title: "12. Urban Acoustic Tolerance",
        content: "The tenant acknowledges that the property is located in an urban, tourist, or developing area, and therefore accepts the possibility of occasional noises (traffic, music, construction) and that these do not constitute grounds for complaint, termination, or refund request."
      },
      {
        title: "13. Maintenance and Repairs",
        content: "From 30 days after the start of the lease agreement, the tenant will be responsible for performing preventive maintenance on the air conditioning units every six (6) months and/or at the time of their departure (check-out) from the property. Likewise, they will be responsible for covering any repair of items, appliances, or furniture that shows defects not reported within the first 30 days of the contract's validity."
      }
    ]
  }
};

const defaultOwnerTerms = {
  es: {
    title: "Términos y Condiciones para Propietarios",
    subtitle: "Condiciones de servicio y responsabilidades del propietario",
    sections: [
      {
        title: "1. Servicios de Administración",
        content: "Tulum Rental Homes ofrece servicios integrales de administración de propiedades que incluyen: publicación y promoción de la propiedad, gestión de inquilinos, cobro de rentas, coordinación de mantenimiento y reportes mensuales."
      },
      {
        title: "2. Comisiones",
        content: "La comisión por servicio de colocación es de 1 mes de renta para contratos anuales y medio mes para contratos de 6 meses. Para ventas, la comisión es del 6% del valor de la propiedad. Los términos específicos se detallan en el contrato de servicios."
      },
      {
        title: "3. Responsabilidades del Propietario",
        content: "El propietario es responsable de: mantener la propiedad en condiciones habitables, realizar reparaciones estructurales y de sistemas principales, mantener vigentes los permisos necesarios y cumplir con las obligaciones fiscales correspondientes."
      },
      {
        title: "4. Documentación Requerida",
        content: "El propietario deberá proporcionar: identificación oficial, comprobante de propiedad, RFC (si aplica), contrato de servicios firmado y las llaves o accesos necesarios para la gestión de la propiedad."
      },
      {
        title: "5. Pagos y Transferencias",
        content: "Los pagos de renta se transferirán al propietario dentro de los 5 días hábiles posteriores a la recepción del pago del inquilino, descontando las comisiones y gastos acordados. Se proporcionará un desglose mensual de todos los movimientos."
      },
      {
        title: "6. Mantenimiento y Reparaciones",
        content: "Las solicitudes de mantenimiento se coordinarán con proveedores de confianza. Para reparaciones urgentes menores a $5,000 MXN, se procederá inmediatamente notificando al propietario. Para montos mayores, se solicitará autorización previa."
      },
      {
        title: "7. Renovación y Terminación",
        content: "Los contratos de administración se renuevan automáticamente a menos que se notifique la terminación con 60 días de anticipación. La terminación anticipada puede estar sujeta a penalidades según lo establecido en el contrato."
      },
      {
        title: "8. Exclusividad",
        content: "Durante la vigencia del contrato, Tulum Rental Homes será el representante exclusivo para la comercialización de la propiedad. Esto garantiza una gestión eficiente y evita conflictos con múltiples intermediarios."
      }
    ]
  },
  en: {
    title: "Terms and Conditions for Property Owners",
    subtitle: "Service conditions and owner responsibilities",
    sections: [
      {
        title: "1. Property Management Services",
        content: "Tulum Rental Homes offers comprehensive property management services including: property listing and promotion, tenant management, rent collection, maintenance coordination, and monthly reports."
      },
      {
        title: "2. Commissions",
        content: "The placement service commission is 1 month's rent for annual contracts and half a month for 6-month contracts. For sales, the commission is 6% of the property value. Specific terms are detailed in the service contract."
      },
      {
        title: "3. Owner Responsibilities",
        content: "The owner is responsible for: keeping the property in habitable condition, making structural and major system repairs, keeping necessary permits current, and complying with corresponding tax obligations."
      },
      {
        title: "4. Required Documentation",
        content: "The owner must provide: official identification, proof of ownership, RFC (if applicable), signed service contract, and keys or access necessary for property management."
      },
      {
        title: "5. Payments and Transfers",
        content: "Rent payments will be transferred to the owner within 5 business days after receiving the tenant's payment, deducting agreed commissions and expenses. A monthly breakdown of all transactions will be provided."
      },
      {
        title: "6. Maintenance and Repairs",
        content: "Maintenance requests will be coordinated with trusted providers. For urgent repairs under $5,000 MXN, we will proceed immediately notifying the owner. For larger amounts, prior authorization will be requested."
      },
      {
        title: "7. Renewal and Termination",
        content: "Management contracts are automatically renewed unless termination is notified 60 days in advance. Early termination may be subject to penalties as established in the contract."
      },
      {
        title: "8. Exclusivity",
        content: "During the contract term, Tulum Rental Homes will be the exclusive representative for marketing the property. This ensures efficient management and avoids conflicts with multiple intermediaries."
      }
    ]
  }
};

const defaultGeneralTerms = {
  es: {
    title: "Términos y Condiciones Generales",
    subtitle: "Condiciones de uso de la plataforma Tulum Rental Homes",
    sections: [
      {
        title: "1. Aceptación de Términos",
        content: "Al acceder y utilizar la plataforma Tulum Rental Homes, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios."
      },
      {
        title: "2. Uso de la Plataforma",
        content: "Nuestra plataforma conecta propietarios de propiedades con potenciales inquilinos y compradores. Los usuarios se comprometen a proporcionar información precisa y actualizada, y a utilizar la plataforma de manera responsable y legal."
      },
      {
        title: "3. Registro de Usuario",
        content: "Para acceder a ciertas funcionalidades, debe crear una cuenta. Es su responsabilidad mantener la confidencialidad de sus credenciales de acceso y es responsable de todas las actividades realizadas bajo su cuenta."
      },
      {
        title: "4. Listados de Propiedades",
        content: "Los propietarios son responsables de la precisión de la información proporcionada en sus listados. Tulum Rental Homes se reserva el derecho de remover listados que violen estos términos o que contengan información falsa o engañosa."
      },
      {
        title: "5. Limitación de Responsabilidad",
        content: "Tulum Rental Homes actúa como intermediario y no es responsable de las transacciones realizadas entre propietarios e inquilinos/compradores. No garantizamos la disponibilidad, calidad o condición de las propiedades listadas."
      },
      {
        title: "6. Propiedad Intelectual",
        content: "Todo el contenido de la plataforma, incluyendo textos, gráficos, logos e imágenes, es propiedad de Tulum Rental Homes o sus licenciantes y está protegido por las leyes de propiedad intelectual."
      },
      {
        title: "7. Modificaciones",
        content: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación en la plataforma."
      },
      {
        title: "8. Jurisdicción",
        content: "Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales competentes de Quintana Roo, México."
      }
    ]
  },
  en: {
    title: "General Terms and Conditions",
    subtitle: "Terms of use for the Tulum Rental Homes platform",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: "By accessing and using the Tulum Rental Homes platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not use our services."
      },
      {
        title: "2. Platform Use",
        content: "Our platform connects property owners with potential tenants and buyers. Users agree to provide accurate and up-to-date information, and to use the platform responsibly and legally."
      },
      {
        title: "3. User Registration",
        content: "To access certain features, you must create an account. It is your responsibility to maintain the confidentiality of your login credentials and you are responsible for all activities performed under your account."
      },
      {
        title: "4. Property Listings",
        content: "Property owners are responsible for the accuracy of information provided in their listings. Tulum Rental Homes reserves the right to remove listings that violate these terms or contain false or misleading information."
      },
      {
        title: "5. Limitation of Liability",
        content: "Tulum Rental Homes acts as an intermediary and is not responsible for transactions between owners and tenants/buyers. We do not guarantee the availability, quality, or condition of listed properties."
      },
      {
        title: "6. Intellectual Property",
        content: "All content on the platform, including text, graphics, logos, and images, is the property of Tulum Rental Homes or its licensors and is protected by intellectual property laws."
      },
      {
        title: "7. Modifications",
        content: "We reserve the right to modify these terms at any time. Modifications will be effective immediately upon posting on the platform."
      },
      {
        title: "8. Jurisdiction",
        content: "These terms are governed by the laws of Mexico. Any dispute will be resolved in the competent courts of Quintana Roo, Mexico."
      }
    ]
  }
};

export default function PublicTerms({ type }: PublicTermsProps) {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  
  const TRH_AGENCY_ID = "trh-main";
  
  const { data: apiTerms, isLoading } = useQuery<ExternalTermsAndConditions | null>({
    queryKey: ['/api/public/external-terms', TRH_AGENCY_ID, type],
    enabled: type !== 'general',
  });

  const getDefaultTerms = () => {
    switch (type) {
      case 'tenant':
        return defaultTenantTerms[language];
      case 'owner':
        return defaultOwnerTerms[language];
      default:
        return defaultGeneralTerms[language];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'tenant':
        return <User className="h-6 w-6" />;
      case 'owner':
        return <Building2 className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getBadgeText = () => {
    switch (type) {
      case 'tenant':
        return language === 'es' ? 'Para Inquilinos' : 'For Tenants';
      case 'owner':
        return language === 'es' ? 'Para Propietarios' : 'For Owners';
      default:
        return language === 'es' ? 'General' : 'General';
    }
  };

  const defaultTerms = getDefaultTerms();
  
  const hasApiContent = apiTerms?.content && apiTerms.content.trim().length > 0;
  const displayTitle = hasApiContent ? (apiTerms.title || defaultTerms.title) : defaultTerms.title;

  if (isLoading && type !== 'general') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/tulum-rental-homes")}
              className="gap-2"
              data-testid="button-back-home"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'es' ? 'Volver al inicio' : 'Back to home'}
            </Button>
            <img src={logoIcon} alt="Tulum Rental Homes" className="h-10 w-auto" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
            {getIcon()}
          </div>
          <Badge variant="secondary" className="mb-4">
            {getBadgeText()}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="heading-terms-title">
            {displayTitle}
          </h1>
          <p className="text-muted-foreground text-lg">
            {defaultTerms.subtitle}
          </p>
        </div>

        {hasApiContent ? (
          <Card className="mb-8">
            <CardContent className="p-6 sm:p-8">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: apiTerms.content }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {defaultTerms.sections.map((section, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-5 sm:p-6">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2">{section.title.replace(/^\d+\.\s*/, '')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Separator className="my-10" />

        <Card className="bg-muted/30">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'es' ? '¿Tienes dudas?' : 'Have questions?'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'es' 
                    ? 'Nuestro equipo está disponible para resolver cualquier consulta sobre estos términos.'
                    : 'Our team is available to answer any questions about these terms.'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <a 
                    href="mailto:administracion@tulumrentalhomes.com.mx" 
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    administracion@tulumrentalhomes.com.mx
                  </a>
                  <a 
                    href="tel:+529843213385" 
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    +52 984 321 3385
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {language === 'es' ? 'Última actualización:' : 'Last updated:'}{' '}
            {new Date().toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Tulum, Quintana Roo, México
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {type !== 'tenant' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/terminos/inquilinos")}
              data-testid="button-terms-tenants"
            >
              <User className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Términos Inquilinos' : 'Tenant Terms'}
            </Button>
          )}
          {type !== 'owner' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/terminos/propietarios")}
              data-testid="button-terms-owners"
            >
              <Building2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Términos Propietarios' : 'Owner Terms'}
            </Button>
          )}
          {type !== 'general' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/terminos")}
              data-testid="button-terms-general"
            >
              <FileText className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Términos Generales' : 'General Terms'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
