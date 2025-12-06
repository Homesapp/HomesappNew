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
        title: "1. Aceptación del Pago de Comisión",
        content: "Por medio de la presente, el propietario acepta pagar a la Agencia Tulum Rental Homes una comisión correspondiente a: 3 meses de renta en caso de firmarse contrato de 5 años; 2.5 meses de renta en caso de firmarse un contrato de 4 años; 2 meses de renta en caso de firmarse un contrato de 3 años; 1.5 meses de renta en caso de firmarse un contrato de 2 años; 1 mes completo de renta en caso de firmarse un contrato de 1 año; 1/2 mes de renta en caso de firmarse un contrato de 6 meses. En caso de que el contrato sea por un período menor a 6 meses, se aplicará la modalidad vacacional, con una comisión del 15% sobre el monto total de la reserva."
      },
      {
        title: "2. Entrega de la Propiedad al Inquilino",
        content: "El propietario se compromete a realizar las reparaciones necesarias en la propiedad, garantizando que ésta se encuentre en condiciones habitables y adecuadas para el inquilino al momento del check-in. En caso de no cumplir con dichas reparaciones antes de la fecha de ingreso, el propietario acepta realizarlas dentro de un plazo máximo de 30 días naturales posteriores a la entrega. Tulum Rental Homes no se hace responsable de la devolución de la comisión en caso de que el inquilino alegue problemas de mantenimiento en la propiedad, ya sea desde el día del check-in o en cualquier momento durante el período de arrendamiento."
      },
      {
        title: "3. Entrega de Administración y Reconocimiento de Gestión",
        content: "El propietario declara que la Agencia Tulum Rental Homes ha actuado en todo momento con buena fe y que ha colaborado efectivamente en la localización del inquilino. Asimismo, manifiesta que no ha existido dolo, fraude o mala práctica por parte de la Agencia."
      },
      {
        title: "4. Aceptación de Promoción y Uso de Materiales",
        content: "El propietario autoriza el uso del material promocional (fotografías, videos, tours 360, descripciones, etc.) generado por la Agencia Tulum Rental Homes para la promoción, renta y/o venta de su propiedad. Este material será de libre uso por parte de la Agencia en sus plataformas digitales y/o físicas."
      },
      {
        title: "5. Aceptación en Caso de Cancelación",
        content: "El propietario acepta que, en caso de haber aceptado formalmente una oferta y posteriormente decida retractarse antes de la firma del contrato, deberá reembolsar directamente al inquilino la cantidad entregada como anticipo o apartado de la propiedad."
      },
      {
        title: "6. Responsabilidad de la Agencia y Apoyo en la Mediación",
        content: "La Agencia Tulum Rental Homes declara que su responsabilidad se limita a la intermediación entre arrendador y arrendatario durante el proceso de renta. Una vez firmado el contrato de arrendamiento, la Agencia no se hace responsable por daños materiales, incumplimientos contractuales o conflictos entre las partes. Sin embargo, se compromete, dentro de sus posibilidades y en un marco de buena fe, a interceder y apoyar en la mediación de conflictos domésticos que puedan surgir durante el tiempo que el inquilino habite el inmueble, con el objetivo de mantener una relación armónica entre ambas partes."
      },
      {
        title: "7. Exclusión de Responsabilidad por Mantenimiento y Gastos Operativos",
        content: "La Agencia Tulum Rental Homes no se hace responsable por el mantenimiento físico o técnico del inmueble (salvo acuerdo expreso). Toda gestión, reparación o gasto relacionado con servicios básicos, mobiliario, electrodomésticos u otros elementos del inmueble será responsabilidad exclusiva del propietario, a menos que se contrate a la Agencia Tulum Rental Homes para un servicio de administración integral o eventual."
      },
      {
        title: "8. Autorización para Firmar Preacuerdos",
        content: "El propietario autoriza a la Agencia Tulum Rental Homes a presentar ofertas, recibir depósitos de apartado y gestionar preacuerdos de renta en su representación, en función de las condiciones previamente establecidas con él. La Agencia se compromete a mantener comunicación oportuna sobre cada oferta recibida. El propietario no podrá retractarse sin causa justificada una vez aceptada una oferta formal."
      },
      {
        title: "9. Servicios Adicionales de Mantenimientos de la Agencia",
        content: "Todos los servicios de la Agencia que el propietario contrate, ya sea mantenimiento, limpieza, conserjería, contaduría o abogacía, se le sumará un 15% adicional por gastos administrativos, al valor de la cotización."
      },
      {
        title: "10. Protección de Datos y Uso de Información",
        content: "El propietario autoriza el uso de su información únicamente para fines relacionados con la promoción, renta y gestión del inmueble, respetando la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. La Agencia no compartirá estos datos con terceros ajenos al proceso sin autorización expresa."
      },
      {
        title: "11. Matrícula de Asesores Inmobiliarios",
        content: "La Agencia Tulum Rental Homes opera con base en la matrícula inmobiliaria de persona física registrada a nombre de Maximiliano Rocca, la cual ha sido emitida y aprobada por la Secretaría de Desarrollo Territorial Urbano Sustentable (SEDETUS) del Estado de Quintana Roo. Número de Matrícula: 191613HF0H0DFS009001181. El propietario puede verificar la vigencia y validez de dicha matrícula a través del sitio web oficial de SEDETUS."
      },
      {
        title: "12. Alcance de los Servicios y Responsabilidad de la Agencia",
        content: "Tulum Rental Homes actúa exclusivamente como broker o corredor inmobiliario, limitando su intervención a la promoción, intermediación y firma de contratos de arrendamiento entre propietarios e inquilinos. No ofrecemos servicios de administración de propiedades (property management) bajo ningún concepto. Podemos proporcionar servicios particulares —como limpieza, mantenimiento o asesoría— previa solicitud del propietario, y conforme a las condiciones establecidas en el punto 7 de este documento. Sin embargo, la Agencia no asume responsabilidad alguna sobre el mantenimiento, estado físico o conservación de la propiedad, ni sobre reparaciones anteriores o posteriores a la entrega al inquilino. La obligación de mantener la propiedad en condiciones habitables recae exclusivamente en el propietario."
      }
    ]
  },
  en: {
    title: "Terms and Conditions for Property Owners",
    subtitle: "Service conditions and owner responsibilities",
    sections: [
      {
        title: "1. Acceptance of Commission Payment",
        content: "By means of this document, the owner agrees to pay Tulum Rental Homes Agency a commission corresponding to: 3 months' rent for 5-year contracts; 2.5 months' rent for 4-year contracts; 2 months' rent for 3-year contracts; 1.5 months' rent for 2-year contracts; 1 full month's rent for 1-year contracts; 1/2 month's rent for 6-month contracts. For contracts shorter than 6 months, the vacation modality will apply, with a commission of 15% on the total reservation amount."
      },
      {
        title: "2. Property Delivery to Tenant",
        content: "The owner commits to making the necessary repairs to the property, ensuring it is in habitable and suitable condition for the tenant at the time of check-in. If these repairs are not completed before the move-in date, the owner agrees to complete them within a maximum period of 30 calendar days after delivery. Tulum Rental Homes is not responsible for refunding the commission if the tenant alleges maintenance problems with the property, whether from the check-in day or at any time during the lease period."
      },
      {
        title: "3. Delivery of Administration and Recognition of Management",
        content: "The owner declares that Tulum Rental Homes Agency has acted in good faith at all times and has effectively collaborated in locating the tenant. Likewise, the owner states that there has been no fraud, deceit, or bad practice on the part of the Agency."
      },
      {
        title: "4. Acceptance of Promotion and Use of Materials",
        content: "The owner authorizes the use of promotional material (photographs, videos, 360 tours, descriptions, etc.) generated by Tulum Rental Homes Agency for the promotion, rental, and/or sale of their property. This material will be freely used by the Agency on its digital and/or physical platforms."
      },
      {
        title: "5. Acceptance in Case of Cancellation",
        content: "The owner accepts that, in case of having formally accepted an offer and subsequently deciding to withdraw before signing the contract, they must directly reimburse the tenant the amount delivered as an advance or property reservation."
      },
      {
        title: "6. Agency Responsibility and Mediation Support",
        content: "Tulum Rental Homes Agency declares that its responsibility is limited to intermediation between landlord and tenant during the rental process. Once the lease agreement is signed, the Agency is not responsible for material damages, contractual breaches, or conflicts between the parties. However, it commits, within its possibilities and in a framework of good faith, to intercede and support in the mediation of domestic conflicts that may arise during the time the tenant occupies the property, with the objective of maintaining a harmonious relationship between both parties."
      },
      {
        title: "7. Exclusion of Liability for Maintenance and Operating Expenses",
        content: "Tulum Rental Homes Agency is not responsible for the physical or technical maintenance of the property (except by express agreement). All management, repairs, or expenses related to basic services, furniture, appliances, or other property elements will be the exclusive responsibility of the owner, unless Tulum Rental Homes Agency is contracted for comprehensive or occasional management services."
      },
      {
        title: "8. Authorization to Sign Pre-agreements",
        content: "The owner authorizes Tulum Rental Homes Agency to present offers, receive reservation deposits, and manage rental pre-agreements on their behalf, based on the conditions previously established with them. The Agency commits to maintaining timely communication about each offer received. The owner cannot withdraw without justified cause once a formal offer has been accepted."
      },
      {
        title: "9. Additional Agency Maintenance Services",
        content: "For all Agency services that the owner contracts, whether maintenance, cleaning, concierge, accounting, or legal services, an additional 15% will be added for administrative expenses to the quoted value."
      },
      {
        title: "10. Data Protection and Use of Information",
        content: "The owner authorizes the use of their information solely for purposes related to the promotion, rental, and management of the property, respecting the Federal Law on Protection of Personal Data Held by Private Parties. The Agency will not share this data with third parties outside the process without express authorization."
      },
      {
        title: "11. Real Estate Advisor Registration",
        content: "Tulum Rental Homes Agency operates based on the real estate registration of a natural person registered under the name of Maximiliano Rocca, which has been issued and approved by the Secretary of Sustainable Urban Territorial Development (SEDETUS) of the State of Quintana Roo. Registration Number: 191613HF0H0DFS009001181. The owner can verify the validity of this registration through the official SEDETUS website."
      },
      {
        title: "12. Scope of Services and Agency Responsibility",
        content: "Tulum Rental Homes acts exclusively as a real estate broker, limiting its intervention to the promotion, intermediation, and signing of lease agreements between owners and tenants. We do not offer property management services under any circumstances. We can provide particular services—such as cleaning, maintenance, or consulting—upon owner request, and according to the conditions established in point 7 of this document. However, the Agency assumes no responsibility for the maintenance, physical condition, or conservation of the property, nor for repairs before or after delivery to the tenant. The obligation to maintain the property in habitable condition rests exclusively with the owner."
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
        </div>
      </div>
    </div>
  );
}
