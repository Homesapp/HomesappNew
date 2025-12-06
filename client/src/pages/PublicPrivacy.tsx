import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Shield, 
  User, 
  Building2, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  FileText,
  Database,
  Cookie,
  Clock,
  Scale,
  Globe,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

const companyInfo = {
  razonSocial: "Maximiliano Rocca",
  nombreComercial: "Homesapp",
  domicilio: "Calle Chum Yam Che SN, Esq Cocodrilo, Ejido, Tulum, Quintana Roo, México",
  email: "administracion@tulumrentalhomes.com.mx",
  telefono: "+52 984 321 3385",
  appName: "HomesApp",
  siteName: "tulumrentalhomes.com.mx"
};

const privacyContent = {
  es: {
    title: "Política de Privacidad",
    subtitle: "Aplicación Móvil y Web",
    lastUpdate: "Diciembre 2024",
    sections: [
      {
        icon: User,
        title: "1. Identidad y Datos de Contacto del Responsable",
        content: `Esta Política de Privacidad regula el tratamiento de los datos personales recopilados a través de la aplicación ${companyInfo.appName} (la "App") y del sitio web asociado ${companyInfo.siteName} (el "Sitio").`,
        details: [
          { label: "Razón social", value: companyInfo.razonSocial },
          { label: "Nombre comercial", value: companyInfo.nombreComercial },
          { label: "Domicilio", value: companyInfo.domicilio },
          { label: "Correo electrónico", value: companyInfo.email },
          { label: "Teléfono", value: companyInfo.telefono }
        ],
        note: "El Responsable lleva a cabo el tratamiento de los datos personales conforme a la legislación aplicable en materia de protección de datos, incluyendo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento."
      },
      {
        icon: Globe,
        title: "2. Ámbito de Aplicación",
        content: "Esta Política de Privacidad aplica a:",
        list: [
          "Usuarios propietarios que utilizan la App para administrar sus propiedades.",
          "Usuarios inquilinos o prospectos de inquilinos que utilizan la App/Sitio para gestionar rentas, pagos o consultas.",
          "Agencias externas, colaboradores o terceros registrados en la App.",
          "Cualquier otra persona que interactúe con la App, el Sitio o nuestros servicios digitales."
        ],
        note: "El uso de la App implica que el usuario ha leído y acepta los términos de esta Política de Privacidad."
      },
      {
        icon: Database,
        title: "3. Datos Personales que Recopilamos",
        subsections: [
          {
            subtitle: "3.1. Datos de identificación",
            items: ["Nombre(s) y apellidos", "Número de identificación oficial (INE, pasaporte)", "Firma autógrafa o electrónica/digital"]
          },
          {
            subtitle: "3.2. Datos de contacto",
            items: ["Correo electrónico", "Número de teléfono fijo y/o móvil (incluyendo WhatsApp)", "Domicilio (particular, laboral y/o de la propiedad)"]
          },
          {
            subtitle: "3.3. Datos relacionados con la propiedad",
            items: ["Datos de la propiedad (dirección, características, fotografías, planos, inventario)", "Datos de contrato de renta, compra o administración", "Historial de pagos, adeudos, depósitos en garantía y facturación", "Información sobre mantenimientos, reportes de incidencias"]
          },
          {
            subtitle: "3.4. Datos de uso de la App y del Sitio",
            items: ["Datos técnicos del dispositivo (modelo, sistema operativo, versión de la App)", "Dirección IP, tipo de navegador, idioma, fechas y horas de acceso", "Secciones visitadas, acciones realizadas, tiempo de sesión"]
          },
          {
            subtitle: "3.5. Datos de geolocalización",
            items: ["Datos de ubicación aproximada o precisa, solo si otorgas el permiso desde tu dispositivo"]
          },
          {
            subtitle: "3.6. Datos financieros y de pago",
            items: ["Información parcial de tarjetas de crédito/débito (nunca almacenamos el CVV)", "Datos de cuentas bancarias o CLABE para depósitos o transferencias", "Identificadores y comprobantes de pago emitidos por pasarelas de pago externas"]
          }
        ]
      },
      {
        icon: FileText,
        title: "4. Formas en que Obtenemos tus Datos",
        content: "Recopilamos tus datos personales de las siguientes formas:",
        subsections: [
          {
            subtitle: "Directamente de ti, cuando:",
            items: ["Te registras en la App o en el Sitio", "Completas formularios, subes documentos o actualizas tu perfil", "Te comunicas con nosotros por correo, teléfono, WhatsApp o dentro de la App"]
          },
          {
            subtitle: "Indirectamente, cuando:",
            items: ["Otra persona te registra como inquilino o contacto en la App", "Obtenemos información de fuentes públicas o registros oficiales"]
          },
          {
            subtitle: "Automáticamente, cuando:",
            items: ["Navegas en el Sitio o utilizas la App, mediante cookies, píxeles, SDKs y tecnologías similares"]
          }
        ]
      },
      {
        icon: CheckCircle,
        title: "5. Finalidades del Tratamiento",
        content: "Tratamos tus datos personales para las siguientes finalidades:",
        subsections: [
          {
            subtitle: "Finalidades primarias (necesarias para el servicio):",
            items: [
              "Creación y gestión de tu cuenta de usuario",
              "Administración de propiedades y contratos",
              "Gestión de pagos y facturación",
              "Comunicación y atención al cliente",
              "Seguridad y cumplimiento legal"
            ]
          },
          {
            subtitle: "Finalidades secundarias (opcionales):",
            items: [
              "Envío de información comercial y promocional",
              "Mejora de la App y del Sitio mediante análisis estadísticos",
              "Encuestas de satisfacción"
            ]
          }
        ],
        note: `Si no deseas que tus datos se utilicen para finalidades secundarias, puedes manifestarlo escribiendo a: ${companyInfo.email}`
      },
      {
        icon: Scale,
        title: "6. Base Legal del Tratamiento",
        content: "El tratamiento de tus datos personales se realiza con base en:",
        list: [
          "Tu consentimiento expreso o tácito al registrarte y utilizar la App/Sitio",
          "La relación contractual que exista contigo (como propietario, inquilino, agencia o colaborador)",
          "Intereses legítimos del Responsable relacionados con la administración de propiedades",
          "Obligaciones legales aplicables (fiscales o regulatorias)"
        ]
      },
      {
        icon: Building2,
        title: "7. Compartición y Transferencia de Datos",
        content: "Podemos compartir tus datos personales con:",
        list: [
          "Proveedores de servicios tecnológicos (hosting, almacenamiento en la nube, mensajería)",
          "Pasarelas de pago y entidades financieras (Stripe, PayPal, bancos)",
          "Despachos legales, contables y de auditoría cuando sea necesario",
          "Autoridades competentes cuando sea requerido por ley",
          "Otros usuarios de la plataforma en la medida necesaria para la operación del servicio"
        ],
        note: "Las transferencias internacionales de datos se llevarán a cabo conforme a los requisitos legales aplicables."
      },
      {
        icon: Cookie,
        title: "8. Cookies y Tecnologías Similares",
        content: "Cuando utilizas la App o el Sitio, podemos usar cookies y tecnologías similares para:",
        list: [
          "Recordar tus preferencias, sesión iniciada y configuraciones",
          "Obtener información estadística y de rendimiento",
          "Mejorar la experiencia de usuario y mostrar contenido relevante"
        ],
        note: "Puedes configurar tu navegador o dispositivo para rechazar o eliminar cookies; sin embargo, algunas funciones pueden no estar disponibles si lo haces."
      },
      {
        icon: Clock,
        title: "9. Plazo de Conservación de los Datos",
        content: "Conservaremos tus datos personales durante el tiempo que sea necesario para:",
        list: [
          "Cumplir con las finalidades del tratamiento descritas en esta Política",
          "Mantener tu cuenta activa y prestar los servicios",
          "Dar cumplimiento a obligaciones legales, contractuales o fiscales aplicables"
        ],
        note: "Una vez que los datos ya no sean necesarios, serán eliminados o anonimizados de forma segura."
      },
      {
        icon: Lock,
        title: "10. Medidas de Seguridad",
        content: "El Responsable implementa medidas de seguridad administrativas, técnicas y físicas para proteger tus datos personales:",
        list: [
          "Control de acceso a sistemas y bases de datos",
          "Contraseñas cifradas y políticas de autenticación",
          "Respaldos periódicos de información",
          "Uso de conexiones seguras (HTTPS)"
        ],
        note: "Ningún sistema es completamente infalible; el usuario también es responsable de mantener la confidencialidad de sus credenciales."
      },
      {
        icon: Eye,
        title: "11. Derechos de los Titulares (ARCO)",
        content: "Como titular de datos personales, puedes ejercer los siguientes derechos:",
        list: [
          "Acceso: conocer qué datos personales tenemos y cómo los utilizamos",
          "Rectificación: solicitar la corrección de datos inexactos o desactualizados",
          "Cancelación: solicitar la supresión de tus datos cuando ya no sean necesarios",
          "Oposición: oponerte al tratamiento de tus datos para fines específicos"
        ],
        subsections: [
          {
            subtitle: "Procedimiento para ejercer tus derechos:",
            items: [
              `Envía una solicitud por escrito a: ${companyInfo.email}`,
              "Incluye tu nombre completo y documento de identidad",
              "Describe claramente el derecho que deseas ejercer",
              "Indica el correo con el que te registraste"
            ]
          }
        ]
      },
      {
        icon: AlertCircle,
        title: "12. Tratamiento de Datos de Menores de Edad",
        content: "Nuestros servicios no están dirigidos a menores de edad. No recopilamos de forma intencional datos personales de menores de 18 años.",
        note: "Si consideras que un menor nos ha proporcionado datos personales sin el consentimiento correspondiente, contáctanos de inmediato para proceder a su eliminación."
      },
      {
        icon: Globe,
        title: "13. Enlaces a Sitios de Terceros",
        content: "La App y el Sitio pueden incluir enlaces a sitios web de terceros (pasarelas de pago, redes sociales, servicios de mensajería). Esta Política de Privacidad no cubre dichos sitios.",
        note: "Te recomendamos revisar las políticas de privacidad de cada tercero antes de proporcionarles tus datos."
      },
      {
        icon: FileText,
        title: "14. Actualizaciones de la Política",
        content: "Podremos actualizar esta Política de Privacidad en cualquier momento para reflejar cambios en la App, en nuestras prácticas o en la normativa aplicable.",
        note: "Cuando hagamos cambios relevantes, notificaremos a los usuarios a través de la App, del Sitio o por correo electrónico. El uso continuado después de tales cambios implicará la aceptación de la Política modificada."
      }
    ]
  },
  en: {
    title: "Privacy Policy",
    subtitle: "Mobile and Web Application",
    lastUpdate: "December 2024",
    sections: [
      {
        icon: User,
        title: "1. Identity and Contact Details of the Data Controller",
        content: `This Privacy Policy governs the processing of personal data collected through the ${companyInfo.appName} application (the "App") and the associated website ${companyInfo.siteName} (the "Site").`,
        details: [
          { label: "Legal name", value: companyInfo.razonSocial },
          { label: "Trade name", value: companyInfo.nombreComercial },
          { label: "Address", value: companyInfo.domicilio },
          { label: "Email", value: companyInfo.email },
          { label: "Phone", value: companyInfo.telefono }
        ],
        note: "The Data Controller processes personal data in accordance with applicable data protection legislation, including Mexico's Federal Law on Protection of Personal Data Held by Private Parties and its Regulations."
      },
      {
        icon: Globe,
        title: "2. Scope of Application",
        content: "This Privacy Policy applies to:",
        list: [
          "Property owners who use the App to manage their properties.",
          "Tenants or prospective tenants who use the App/Site to manage rentals, payments, or inquiries.",
          "External agencies, collaborators, or third parties registered in the App.",
          "Any other person who interacts with the App, Site, or our digital services."
        ],
        note: "Using the App implies that the user has read and accepts the terms of this Privacy Policy."
      },
      {
        icon: Database,
        title: "3. Personal Data We Collect",
        subsections: [
          {
            subtitle: "3.1. Identification data",
            items: ["First and last name(s)", "Official ID number (passport, government ID)", "Handwritten or electronic/digital signature"]
          },
          {
            subtitle: "3.2. Contact data",
            items: ["Email address", "Landline and/or mobile phone number (including WhatsApp)", "Address (personal, work, and/or property)"]
          },
          {
            subtitle: "3.3. Property-related data",
            items: ["Property data (address, features, photographs, plans, inventory)", "Rental, purchase, or management contract data", "Payment history, debts, security deposits, and billing", "Information about maintenance, incident reports"]
          },
          {
            subtitle: "3.4. App and Site usage data",
            items: ["Device technical data (model, operating system, App version)", "IP address, browser type, language, access dates and times", "Sections visited, actions performed, session time"]
          },
          {
            subtitle: "3.5. Geolocation data",
            items: ["Approximate or precise location data, only if you grant permission from your device"]
          },
          {
            subtitle: "3.6. Financial and payment data",
            items: ["Partial credit/debit card information (we never store the CVV)", "Bank account or CLABE data for deposits or transfers", "Payment identifiers and receipts issued by external payment gateways"]
          }
        ]
      },
      {
        icon: FileText,
        title: "4. How We Obtain Your Data",
        content: "We collect your personal data in the following ways:",
        subsections: [
          {
            subtitle: "Directly from you, when:",
            items: ["You register on the App or Site", "You complete forms, upload documents, or update your profile", "You contact us by email, phone, WhatsApp, or within the App"]
          },
          {
            subtitle: "Indirectly, when:",
            items: ["Another person registers you as a tenant or contact in the App", "We obtain information from public sources or official records"]
          },
          {
            subtitle: "Automatically, when:",
            items: ["You browse the Site or use the App, through cookies, pixels, SDKs, and similar technologies"]
          }
        ]
      },
      {
        icon: CheckCircle,
        title: "5. Purposes of Processing",
        content: "We process your personal data for the following purposes:",
        subsections: [
          {
            subtitle: "Primary purposes (necessary for the service):",
            items: [
              "Creation and management of your user account",
              "Property and contract administration",
              "Payment and billing management",
              "Communication and customer service",
              "Security and legal compliance"
            ]
          },
          {
            subtitle: "Secondary purposes (optional):",
            items: [
              "Sending commercial and promotional information",
              "Improving the App and Site through statistical analysis",
              "Satisfaction surveys"
            ]
          }
        ],
        note: `If you do not want your data used for secondary purposes, you can indicate this by writing to: ${companyInfo.email}`
      },
      {
        icon: Scale,
        title: "6. Legal Basis for Processing",
        content: "The processing of your personal data is based on:",
        list: [
          "Your express or tacit consent when registering and using the App/Site",
          "The contractual relationship that exists with you (as owner, tenant, agency, or collaborator)",
          "Legitimate interests of the Data Controller related to property administration",
          "Applicable legal obligations (tax or regulatory)"
        ]
      },
      {
        icon: Building2,
        title: "7. Data Sharing and Transfer",
        content: "We may share your personal data with:",
        list: [
          "Technology service providers (hosting, cloud storage, messaging)",
          "Payment gateways and financial institutions (Stripe, PayPal, banks)",
          "Legal, accounting, and auditing firms when necessary",
          "Competent authorities when required by law",
          "Other platform users to the extent necessary for service operation"
        ],
        note: "International data transfers will be carried out in accordance with applicable legal requirements."
      },
      {
        icon: Cookie,
        title: "8. Cookies and Similar Technologies",
        content: "When you use the App or Site, we may use cookies and similar technologies to:",
        list: [
          "Remember your preferences, logged-in session, and settings",
          "Obtain statistical and performance information",
          "Improve user experience and display relevant content"
        ],
        note: "You can configure your browser or device to reject or delete cookies; however, some features may not be available if you do so."
      },
      {
        icon: Clock,
        title: "9. Data Retention Period",
        content: "We will retain your personal data for as long as necessary to:",
        list: [
          "Fulfill the processing purposes described in this Policy",
          "Keep your account active and provide services",
          "Comply with applicable legal, contractual, or tax obligations"
        ],
        note: "Once data is no longer needed, it will be securely deleted or anonymized."
      },
      {
        icon: Lock,
        title: "10. Security Measures",
        content: "The Data Controller implements administrative, technical, and physical security measures to protect your personal data:",
        list: [
          "Access control to systems and databases",
          "Encrypted passwords and authentication policies",
          "Regular information backups",
          "Use of secure connections (HTTPS)"
        ],
        note: "No system is completely infallible; the user is also responsible for maintaining the confidentiality of their credentials."
      },
      {
        icon: Eye,
        title: "11. Data Subject Rights (ARCO)",
        content: "As a data subject, you may exercise the following rights:",
        list: [
          "Access: know what personal data we have and how we use it",
          "Rectification: request correction of inaccurate or outdated data",
          "Cancellation: request deletion of your data when no longer necessary",
          "Opposition: oppose processing of your data for specific purposes"
        ],
        subsections: [
          {
            subtitle: "Procedure to exercise your rights:",
            items: [
              `Send a written request to: ${companyInfo.email}`,
              "Include your full name and identity document",
              "Clearly describe the right you wish to exercise",
              "Indicate the email with which you registered"
            ]
          }
        ]
      },
      {
        icon: AlertCircle,
        title: "12. Processing of Minors' Data",
        content: "Our services are not intended for minors. We do not intentionally collect personal data from persons under 18 years of age.",
        note: "If you believe a minor has provided us with personal data without appropriate consent, please contact us immediately so we can delete it."
      },
      {
        icon: Globe,
        title: "13. Links to Third-Party Sites",
        content: "The App and Site may include links to third-party websites (payment gateways, social networks, messaging services). This Privacy Policy does not cover those sites.",
        note: "We recommend reviewing each third party's privacy policies before providing them with your data."
      },
      {
        icon: FileText,
        title: "14. Policy Updates",
        content: "We may update this Privacy Policy at any time to reflect changes in the App, our practices, or applicable regulations.",
        note: "When we make relevant changes, we will notify users through the App, Site, or email. Continued use after such changes will imply acceptance of the modified Policy."
      }
    ]
  }
};

export default function PublicPrivacy() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  
  const content = privacyContent[language];

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
            <Shield className="h-8 w-8" />
          </div>
          <Badge variant="secondary" className="mb-4">
            {content.lastUpdate}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="heading-privacy-title">
            {content.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {content.subtitle}
          </p>
        </div>

        <div className="space-y-6">
          {content.sections.map((section, idx) => {
            const IconComponent = section.icon;
            return (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg flex-1">{section.title}</h3>
                    </div>
                    
                    {section.content && (
                      <p className="text-muted-foreground mb-4 pl-14">{section.content}</p>
                    )}

                    {section.details && (
                      <div className="pl-14 space-y-2 mb-4">
                        {section.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex flex-wrap gap-2">
                            <span className="font-medium text-sm">{detail.label}:</span>
                            <span className="text-sm text-muted-foreground">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.list && (
                      <ul className="pl-14 space-y-2 mb-4">
                        {section.list.map((item, lIdx) => (
                          <li key={lIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.subsections && (
                      <div className="pl-14 space-y-4">
                        {section.subsections.map((sub, sIdx) => (
                          <div key={sIdx}>
                            <p className="font-medium text-sm mb-2">{sub.subtitle}</p>
                            <ul className="space-y-1.5">
                              {sub.items.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.note && (
                      <p className="pl-14 text-xs text-muted-foreground italic mt-4 p-3 bg-muted/30 rounded-md">
                        {section.note}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-10" />

        <Card className="bg-muted/30">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'es' ? 'Contacto para Consultas de Privacidad' : 'Privacy Inquiries Contact'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'es' 
                    ? 'Si tienes alguna duda, comentario o inquietud relacionada con esta Política de Privacidad o con el tratamiento de tus datos personales, puedes contactarnos.'
                    : 'If you have any questions, comments, or concerns related to this Privacy Policy or the processing of your personal data, you can contact us.'}
                </p>
                <div className="space-y-2 text-sm">
                  <a 
                    href={`mailto:${companyInfo.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {companyInfo.email}
                  </a>
                  <a 
                    href={`tel:${companyInfo.telefono.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {companyInfo.telefono}
                  </a>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {companyInfo.domicilio}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {language === 'es' ? 'Última actualización:' : 'Last updated:'} {content.lastUpdate}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Tulum, Quintana Roo, México
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/terminos/inquilinos")}
            data-testid="button-terms-tenants"
          >
            <User className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Términos Inquilinos' : 'Tenant Terms'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/terminos/propietarios")}
            data-testid="button-terms-owners"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Términos Propietarios' : 'Owner Terms'}
          </Button>
        </div>
      </div>
    </div>
  );
}
