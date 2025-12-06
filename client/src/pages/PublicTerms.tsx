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
        title: "1. Proceso de Arrendamiento",
        content: "El proceso de arrendamiento inicia con la solicitud formal a través de nuestra plataforma. Una vez aprobada su solicitud, se procederá a la firma del contrato de arrendamiento. El inquilino deberá proporcionar documentación que acredite su identidad y capacidad de pago."
      },
      {
        title: "2. Depósito de Garantía",
        content: "Se requiere un depósito de garantía equivalente a un mes de renta, el cual será devuelto al término del contrato siempre que la propiedad se entregue en las mismas condiciones en que fue recibida, descontando el desgaste normal por uso."
      },
      {
        title: "3. Pago de Renta",
        content: "La renta mensual deberá pagarse dentro de los primeros 5 días de cada mes. El pago puede realizarse mediante transferencia bancaria o los métodos establecidos en el contrato. Los pagos tardíos pueden generar cargos por mora según lo estipulado."
      },
      {
        title: "4. Mantenimiento y Cuidado",
        content: "El inquilino se compromete a mantener la propiedad en buen estado, reportando cualquier desperfecto de manera oportuna. Las reparaciones menores derivadas del uso cotidiano son responsabilidad del inquilino. Las reparaciones mayores estructurales corresponden al propietario."
      },
      {
        title: "5. Uso de la Propiedad",
        content: "La propiedad deberá utilizarse exclusivamente para fines habitacionales, a menos que se especifique lo contrario en el contrato. No se permiten subarrendamientos sin autorización expresa por escrito del propietario."
      },
      {
        title: "6. Terminación del Contrato",
        content: "La terminación anticipada del contrato debe notificarse con al menos 30 días de anticipación. El incumplimiento de las obligaciones contractuales puede resultar en la terminación inmediata del arrendamiento."
      },
      {
        title: "7. Servicios Incluidos",
        content: "Los servicios incluidos en la renta varían según la propiedad y se especifican en cada listado. El inquilino es responsable de contratar y pagar los servicios no incluidos como electricidad, internet, gas, entre otros."
      },
      {
        title: "8. Mascotas",
        content: "La política de mascotas varía según la propiedad. Consulte las condiciones específicas antes de solicitar el arrendamiento. En caso de aceptarse mascotas, puede requerirse un depósito adicional."
      }
    ]
  },
  en: {
    title: "Terms and Conditions for Tenants",
    subtitle: "Lease conditions and tenant responsibilities",
    sections: [
      {
        title: "1. Leasing Process",
        content: "The leasing process begins with a formal application through our platform. Once your application is approved, the lease agreement will be signed. The tenant must provide documentation proving their identity and payment capacity."
      },
      {
        title: "2. Security Deposit",
        content: "A security deposit equivalent to one month's rent is required, which will be returned at the end of the contract as long as the property is delivered in the same condition it was received, minus normal wear and tear."
      },
      {
        title: "3. Rent Payment",
        content: "Monthly rent must be paid within the first 5 days of each month. Payment can be made via bank transfer or the methods established in the contract. Late payments may incur late fees as stipulated."
      },
      {
        title: "4. Maintenance and Care",
        content: "The tenant agrees to maintain the property in good condition, reporting any damage promptly. Minor repairs resulting from daily use are the tenant's responsibility. Major structural repairs are the owner's responsibility."
      },
      {
        title: "5. Property Use",
        content: "The property must be used exclusively for residential purposes, unless otherwise specified in the contract. Subleasing is not permitted without express written authorization from the owner."
      },
      {
        title: "6. Contract Termination",
        content: "Early termination of the contract must be notified at least 30 days in advance. Failure to comply with contractual obligations may result in immediate termination of the lease."
      },
      {
        title: "7. Included Services",
        content: "Services included in the rent vary by property and are specified in each listing. The tenant is responsible for contracting and paying for services not included such as electricity, internet, gas, among others."
      },
      {
        title: "8. Pets",
        content: "Pet policy varies by property. Check specific conditions before applying for the lease. If pets are accepted, an additional deposit may be required."
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
