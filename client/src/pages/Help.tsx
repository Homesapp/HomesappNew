import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Building2, 
  Users, 
  FileText, 
  ClipboardCheck,
  DollarSign,
  Settings,
  Video,
  PlayCircle,
  BookOpen,
  UserCog,
  Package,
  Briefcase,
  Scale,
  Calculator,
  Wrench,
  Home,
  Star,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MapPin,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Palmtree,
  Sun,
  Waves,
  Eye
} from "lucide-react";

type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider" | "cliente" | "abogado" | "contador" | "agente_servicios_especiales";

interface HelpSection {
  id: string;
  icon: any;
  titleKey: string;
  descKey: string;
  sections: {
    titleKey: string;
    contentKey: string;
    videoId?: string;
    steps?: string[];
  }[];
}

const roleHelpContent: Record<UserRole, HelpSection[]> = {
  cliente: [
    {
      id: "search",
      icon: Search,
      titleKey: "help.cliente.search.title",
      descKey: "help.cliente.search.desc",
      sections: [
        {
          titleKey: "help.cliente.search.howTo.title",
          contentKey: "help.cliente.search.howTo.content",
          videoId: "search-properties-demo",
          steps: [
            "help.cliente.search.step1",
            "help.cliente.search.step2",
            "help.cliente.search.step3",
            "help.cliente.search.step4"
          ]
        },
        {
          titleKey: "help.cliente.search.filters.title",
          contentKey: "help.cliente.search.filters.content",
          steps: [
            "help.cliente.search.filters.step1",
            "help.cliente.search.filters.step2",
            "help.cliente.search.filters.step3"
          ]
        }
      ]
    },
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.cliente.appointments.title",
      descKey: "help.cliente.appointments.desc",
      sections: [
        {
          titleKey: "help.cliente.appointments.schedule.title",
          contentKey: "help.cliente.appointments.schedule.content",
          videoId: "schedule-appointment-demo",
          steps: [
            "help.cliente.appointments.schedule.step1",
            "help.cliente.appointments.schedule.step2",
            "help.cliente.appointments.schedule.step3",
            "help.cliente.appointments.schedule.step4"
          ]
        },
        {
          titleKey: "help.cliente.appointments.manage.title",
          contentKey: "help.cliente.appointments.manage.content"
        }
      ]
    },
    {
      id: "favorites",
      icon: Heart,
      titleKey: "help.cliente.favorites.title",
      descKey: "help.cliente.favorites.desc",
      sections: [
        {
          titleKey: "help.cliente.favorites.add.title",
          contentKey: "help.cliente.favorites.add.content",
          steps: [
            "help.cliente.favorites.add.step1",
            "help.cliente.favorites.add.step2",
            "help.cliente.favorites.add.step3"
          ]
        }
      ]
    },
    {
      id: "cards",
      icon: FileText,
      titleKey: "help.cliente.cards.title",
      descKey: "help.cliente.cards.desc",
      sections: [
        {
          titleKey: "help.cliente.cards.create.title",
          contentKey: "help.cliente.cards.create.content",
          videoId: "presentation-cards-demo",
          steps: [
            "help.cliente.cards.create.step1",
            "help.cliente.cards.create.step2",
            "help.cliente.cards.create.step3"
          ]
        }
      ]
    },
    {
      id: "chat",
      icon: MessageCircle,
      titleKey: "help.cliente.chat.title",
      descKey: "help.cliente.chat.desc",
      sections: [
        {
          titleKey: "help.cliente.chat.howTo.title",
          contentKey: "help.cliente.chat.howTo.content",
          steps: [
            "help.cliente.chat.howTo.step1",
            "help.cliente.chat.howTo.step2",
            "help.cliente.chat.howTo.step3"
          ]
        }
      ]
    }
  ],
  owner: [
    {
      id: "properties",
      icon: Building2,
      titleKey: "help.owner.properties.title",
      descKey: "help.owner.properties.desc",
      sections: [
        {
          titleKey: "help.owner.properties.upload.title",
          contentKey: "help.owner.properties.upload.content",
          videoId: "upload-property-demo",
          steps: [
            "help.owner.properties.upload.step1",
            "help.owner.properties.upload.step2",
            "help.owner.properties.upload.step3",
            "help.owner.properties.upload.step4"
          ]
        },
        {
          titleKey: "help.owner.properties.manage.title",
          contentKey: "help.owner.properties.manage.content"
        },
        {
          titleKey: "help.owner.properties.changeRequests.title",
          contentKey: "help.owner.properties.changeRequests.content"
        }
      ]
    },
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.owner.appointments.title",
      descKey: "help.owner.appointments.desc",
      sections: [
        {
          titleKey: "help.owner.appointments.autoApprove.title",
          contentKey: "help.owner.appointments.autoApprove.content",
          steps: [
            "help.owner.appointments.autoApprove.step1",
            "help.owner.appointments.autoApprove.step2"
          ]
        },
        {
          titleKey: "help.owner.appointments.manage.title",
          contentKey: "help.owner.appointments.manage.content"
        }
      ]
    },
    {
      id: "staff",
      icon: Users,
      titleKey: "help.owner.staff.title",
      descKey: "help.owner.staff.desc",
      sections: [
        {
          titleKey: "help.owner.staff.assign.title",
          contentKey: "help.owner.staff.assign.content",
          steps: [
            "help.owner.staff.assign.step1",
            "help.owner.staff.assign.step2",
            "help.owner.staff.assign.step3"
          ]
        }
      ]
    },
    {
      id: "contracts",
      icon: FileText,
      titleKey: "help.owner.contracts.title",
      descKey: "help.owner.contracts.desc",
      sections: [
        {
          titleKey: "help.owner.contracts.view.title",
          contentKey: "help.owner.contracts.view.content"
        },
        {
          titleKey: "help.owner.contracts.documents.title",
          contentKey: "help.owner.contracts.documents.content"
        },
        {
          titleKey: "help.owner.contracts.payments.title",
          contentKey: "help.owner.contracts.payments.content"
        },
        {
          titleKey: "help.owner.contracts.services.title",
          contentKey: "help.owner.contracts.services.content",
          videoId: "extraordinary-services-demo"
        }
      ]
    },
    {
      id: "directory",
      icon: Wrench,
      titleKey: "help.owner.directory.title",
      descKey: "help.owner.directory.desc",
      sections: [
        {
          titleKey: "help.owner.directory.find.title",
          contentKey: "help.owner.directory.find.content"
        }
      ]
    }
  ],
  seller: [
    {
      id: "leads",
      icon: Users,
      titleKey: "help.seller.leads.title",
      descKey: "help.seller.leads.desc",
      sections: [
        {
          titleKey: "help.seller.leads.manage.title",
          contentKey: "help.seller.leads.manage.content",
          videoId: "leads-management-demo",
          steps: [
            "help.seller.leads.manage.step1",
            "help.seller.leads.manage.step2",
            "help.seller.leads.manage.step3"
          ]
        },
        {
          titleKey: "help.seller.leads.convert.title",
          contentKey: "help.seller.leads.convert.content"
        }
      ]
    },
    {
      id: "rentals",
      icon: Building2,
      titleKey: "help.seller.rentals.title",
      descKey: "help.seller.rentals.desc",
      sections: [
        {
          titleKey: "help.seller.rentals.kanban.title",
          contentKey: "help.seller.rentals.kanban.content",
          videoId: "rentals-kanban-demo"
        },
        {
          titleKey: "help.seller.rentals.process.title",
          contentKey: "help.seller.rentals.process.content"
        }
      ]
    },
    {
      id: "income",
      icon: DollarSign,
      titleKey: "help.seller.income.title",
      descKey: "help.seller.income.desc",
      sections: [
        {
          titleKey: "help.seller.income.view.title",
          contentKey: "help.seller.income.view.content"
        },
        {
          titleKey: "help.seller.income.commissions.title",
          contentKey: "help.seller.income.commissions.content"
        }
      ]
    }
  ],
  concierge: [
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.concierge.appointments.title",
      descKey: "help.concierge.appointments.desc",
      sections: [
        {
          titleKey: "help.concierge.appointments.view.title",
          contentKey: "help.concierge.appointments.view.content",
          videoId: "concierge-appointments-demo"
        },
        {
          titleKey: "help.concierge.appointments.report.title",
          contentKey: "help.concierge.appointments.report.content",
          steps: [
            "help.concierge.appointments.report.step1",
            "help.concierge.appointments.report.step2",
            "help.concierge.appointments.report.step3"
          ]
        }
      ]
    },
    {
      id: "reviews",
      icon: Star,
      titleKey: "help.concierge.reviews.title",
      descKey: "help.concierge.reviews.desc",
      sections: [
        {
          titleKey: "help.concierge.reviews.leave.title",
          contentKey: "help.concierge.reviews.leave.content"
        }
      ]
    },
    {
      id: "chat",
      icon: MessageCircle,
      titleKey: "help.concierge.chat.title",
      descKey: "help.concierge.chat.desc",
      sections: [
        {
          titleKey: "help.concierge.chat.clients.title",
          contentKey: "help.concierge.chat.clients.content"
        }
      ]
    }
  ],
  provider: [
    {
      id: "profile",
      icon: UserCog,
      titleKey: "help.provider.profile.title",
      descKey: "help.provider.profile.desc",
      sections: [
        {
          titleKey: "help.provider.profile.setup.title",
          contentKey: "help.provider.profile.setup.content",
          videoId: "provider-profile-demo",
          steps: [
            "help.provider.profile.setup.step1",
            "help.provider.profile.setup.step2",
            "help.provider.profile.setup.step3"
          ]
        }
      ]
    },
    {
      id: "services",
      icon: Package,
      titleKey: "help.provider.services.title",
      descKey: "help.provider.services.desc",
      sections: [
        {
          titleKey: "help.provider.services.add.title",
          contentKey: "help.provider.services.add.content"
        },
        {
          titleKey: "help.provider.services.manage.title",
          contentKey: "help.provider.services.manage.content"
        }
      ]
    },
    {
      id: "bookings",
      icon: CheckCircle,
      titleKey: "help.provider.bookings.title",
      descKey: "help.provider.bookings.desc",
      sections: [
        {
          titleKey: "help.provider.bookings.receive.title",
          contentKey: "help.provider.bookings.receive.content"
        },
        {
          titleKey: "help.provider.bookings.complete.title",
          contentKey: "help.provider.bookings.complete.content"
        }
      ]
    }
  ],
  master: [
    {
      id: "users",
      icon: Users,
      titleKey: "help.admin.users.title",
      descKey: "help.admin.users.desc",
      sections: [
        {
          titleKey: "help.admin.users.manage.title",
          contentKey: "help.admin.users.manage.content",
          videoId: "admin-users-demo"
        },
        {
          titleKey: "help.admin.users.roles.title",
          contentKey: "help.admin.users.roles.content"
        }
      ]
    },
    {
      id: "properties",
      icon: Building2,
      titleKey: "help.admin.properties.title",
      descKey: "help.admin.properties.desc",
      sections: [
        {
          titleKey: "help.admin.properties.approve.title",
          contentKey: "help.admin.properties.approve.content",
          videoId: "admin-approve-properties-demo"
        },
        {
          titleKey: "help.admin.properties.changeRequests.title",
          contentKey: "help.admin.properties.changeRequests.content"
        }
      ]
    },
    {
      id: "contracts",
      icon: FileText,
      titleKey: "help.admin.contracts.title",
      descKey: "help.admin.contracts.desc",
      sections: [
        {
          titleKey: "help.admin.contracts.manage.title",
          contentKey: "help.admin.contracts.manage.content"
        },
        {
          titleKey: "help.admin.contracts.monitoring.title",
          contentKey: "help.admin.contracts.monitoring.content"
        }
      ]
    },
    {
      id: "income",
      icon: DollarSign,
      titleKey: "help.admin.income.title",
      descKey: "help.admin.income.desc",
      sections: [
        {
          titleKey: "help.admin.income.overview.title",
          contentKey: "help.admin.income.overview.content"
        }
      ]
    },
    {
      id: "configuration",
      icon: Settings,
      titleKey: "help.admin.config.title",
      descKey: "help.admin.config.desc",
      sections: [
        {
          titleKey: "help.admin.config.system.title",
          contentKey: "help.admin.config.system.content"
        }
      ]
    }
  ],
  admin: [],
  admin_jr: [],
  abogado: [
    {
      id: "contracts",
      icon: Scale,
      titleKey: "help.abogado.contracts.title",
      descKey: "help.abogado.contracts.desc",
      sections: [
        {
          titleKey: "help.abogado.contracts.review.title",
          contentKey: "help.abogado.contracts.review.content",
          videoId: "lawyer-contracts-demo"
        },
        {
          titleKey: "help.abogado.contracts.templates.title",
          contentKey: "help.abogado.contracts.templates.content"
        },
        {
          titleKey: "help.abogado.contracts.signatures.title",
          contentKey: "help.abogado.contracts.signatures.content"
        }
      ]
    },
    {
      id: "agreements",
      icon: FileText,
      titleKey: "help.abogado.agreements.title",
      descKey: "help.abogado.agreements.desc",
      sections: [
        {
          titleKey: "help.abogado.agreements.manage.title",
          contentKey: "help.abogado.agreements.manage.content"
        }
      ]
    }
  ],
  contador: [
    {
      id: "income",
      icon: Calculator,
      titleKey: "help.contador.income.title",
      descKey: "help.contador.income.desc",
      sections: [
        {
          titleKey: "help.contador.income.transactions.title",
          contentKey: "help.contador.income.transactions.content",
          videoId: "accountant-income-demo"
        },
        {
          titleKey: "help.contador.income.batches.title",
          contentKey: "help.contador.income.batches.content",
          steps: [
            "help.contador.income.batches.step1",
            "help.contador.income.batches.step2",
            "help.contador.income.batches.step3"
          ]
        }
      ]
    },
    {
      id: "reports",
      icon: FileText,
      titleKey: "help.contador.reports.title",
      descKey: "help.contador.reports.desc",
      sections: [
        {
          titleKey: "help.contador.reports.generate.title",
          contentKey: "help.contador.reports.generate.content"
        }
      ]
    }
  ],
  agente_servicios_especiales: [
    {
      id: "requests",
      icon: Briefcase,
      titleKey: "help.agente.requests.title",
      descKey: "help.agente.requests.desc",
      sections: [
        {
          titleKey: "help.agente.requests.receive.title",
          contentKey: "help.agente.requests.receive.content",
          videoId: "service-agent-demo"
        },
        {
          titleKey: "help.agente.requests.process.title",
          contentKey: "help.agente.requests.process.content",
          steps: [
            "help.agente.requests.process.step1",
            "help.agente.requests.process.step2",
            "help.agente.requests.process.step3",
            "help.agente.requests.process.step4",
            "help.agente.requests.process.step5"
          ]
        }
      ]
    },
    {
      id: "providers",
      icon: Users,
      titleKey: "help.agente.providers.title",
      descKey: "help.agente.providers.desc",
      sections: [
        {
          titleKey: "help.agente.providers.coordinate.title",
          contentKey: "help.agente.providers.coordinate.content"
        }
      ]
    },
    {
      id: "quality",
      icon: Star,
      titleKey: "help.agente.quality.title",
      descKey: "help.agente.quality.desc",
      sections: [
        {
          titleKey: "help.agente.quality.ensure.title",
          contentKey: "help.agente.quality.ensure.content"
        }
      ]
    }
  ],
  management: []
};

// Admin and Admin Jr share Master content
roleHelpContent.admin = roleHelpContent.master;
roleHelpContent.admin_jr = roleHelpContent.master;
roleHelpContent.management = roleHelpContent.master;

export default function Help() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userRole = (user?.role || "cliente") as UserRole;

  const helpSections = roleHelpContent[userRole] || roleHelpContent.cliente;

  const VideoPlaceholder = ({ videoId }: { videoId: string }) => (
    <div className="relative w-full aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
      <div className="text-center space-y-2">
        <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("help.video.placeholder")}</p>
        <p className="text-xs text-muted-foreground">Video ID: {videoId}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          {t("help.page.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("help.page.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">{t(`help.${userRole}.overview.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`help.${userRole}.overview.desc`)}</p>
          </div>
        </div>

        {helpSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="h-5 w-5" />
                  {t(section.titleKey)}
                </CardTitle>
                <CardDescription>{t(section.descKey)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.sections.map((subsection, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          {t(subsection.titleKey)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {t(subsection.contentKey)}
                        </p>
                        
                        {subsection.videoId && (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="gap-1">
                              <Video className="h-3 w-3" />
                              {t("help.video.tutorial")}
                            </Badge>
                            <VideoPlaceholder videoId={subsection.videoId} />
                          </div>
                        )}

                        {subsection.steps && subsection.steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-semibold text-sm">{t("help.steps.title")}</p>
                            <ol className="list-decimal list-inside space-y-2">
                              {subsection.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="text-sm text-muted-foreground">
                                  {t(step)}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t("help.support.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("help.support.contactDesc")}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {t("help.support.chat")}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {t("help.support.feedback")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(userRole === "seller" || userRole === "master" || userRole === "admin" || user?.role === "external_agency_seller") && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Propuestas de Diseño - Nuevo Home Page
            </CardTitle>
            <CardDescription>
              Explora 3 diseños diferentes para la nueva página principal. Selecciona el que más te guste.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="modern" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="modern" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Moderno</span>
                </TabsTrigger>
                <TabsTrigger value="elegant" className="gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Elegante</span>
                </TabsTrigger>
                <TabsTrigger value="minimal" className="gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Minimalista</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="modern" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background max-h-[600px] overflow-y-auto">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <div className="p-3 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-emerald-400" />
                        <span className="font-bold">HomesApp</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-300 hidden sm:inline">Propiedades</span>
                        <span className="text-slate-300 hidden sm:inline">Servicios</span>
                        <Badge variant="outline" className="text-white border-white/30 text-xs">Entrar</Badge>
                        <Badge className="bg-emerald-500 text-xs">Registro</Badge>
                      </div>
                    </div>
                    <div className="p-6 text-center space-y-3">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">#1 en Bienes Raíces - Tulum</Badge>
                      <h2 className="text-xl sm:text-2xl font-bold">Encuentra tu hogar ideal en Tulum</h2>
                      <p className="text-slate-300 text-xs max-w-md mx-auto">Propiedades exclusivas en la Riviera Maya. Renta o compra con los mejores asesores inmobiliarios.</p>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2 p-2 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                        <Search className="h-4 w-4 text-slate-300" />
                        <span className="text-xs text-slate-300 flex-1">Buscar por zona, tipo o precio...</span>
                        <Button size="sm" className="bg-emerald-500 text-xs h-7">Buscar</Button>
                      </div>
                      <div className="flex justify-center gap-2 mt-3">
                        <Badge variant="outline" className="text-white/70 border-white/20 text-xs">En Renta</Badge>
                        <Badge variant="outline" className="text-white/70 border-white/20 text-xs">En Venta</Badge>
                        <Badge variant="outline" className="text-white/70 border-white/20 text-xs">Destacadas</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Propiedades Destacadas</h3>
                      <span className="text-xs text-emerald-600">Ver todas →</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: "Villa Maya", zone: "Aldea Zamá", price: "$2,500 USD", beds: "3" },
                        { name: "Penthouse Luna", zone: "La Veleta", price: "$1,800 USD", beds: "2" },
                        { name: "Casa Cenote", zone: "Región 15", price: "$3,200 USD", beds: "4" },
                        { name: "Studio Arte", zone: "Centro", price: "$950 USD", beds: "1" }
                      ].map((prop, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
                          <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center relative">
                            <Home className="h-6 w-6 text-slate-400" />
                            <Badge className="absolute top-1 right-1 bg-emerald-500 text-[9px] px-1 py-0">Destacada</Badge>
                          </div>
                          <div className="p-2">
                            <p className="font-medium text-xs truncate">{prop.name}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{prop.zone}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-xs text-emerald-600">{prop.price}</span>
                              <span className="text-[10px] text-muted-foreground">{prop.beds} rec</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-t">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { icon: Building2, label: "200+", desc: "Propiedades" },
                        { icon: Users, label: "50+", desc: "Agentes" },
                        { icon: CheckCircle, label: "500+", desc: "Rentas" },
                        { icon: Star, label: "4.9", desc: "Rating" }
                      ].map((stat, i) => (
                        <div key={i} className="p-2">
                          <stat.icon className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                          <p className="font-bold text-sm">{stat.label}</p>
                          <p className="text-[9px] text-muted-foreground">{stat.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 text-center text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 border-t">
                    <span className="font-medium text-emerald-600">Diseño Moderno:</span> Profesional, enfocado en búsqueda, cards con propiedades destacadas
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="elegant" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background max-h-[600px] overflow-y-auto">
                  <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-800 text-white">
                    <div className="p-3 flex items-center justify-between border-b border-neutral-700/50">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                          <Home className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-light text-lg tracking-widest">HOMESAPP</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-neutral-400 hidden sm:inline tracking-wide">COLECCIONES</span>
                        <span className="text-neutral-400 hidden sm:inline tracking-wide">EXCLUSIVAS</span>
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs">RESERVAR</Badge>
                      </div>
                    </div>
                    <div className="p-8 text-center space-y-4 border-b border-neutral-700/30">
                      <p className="text-rose-300 text-xs tracking-[0.3em] uppercase">Experiencia Inmobiliaria Premium</p>
                      <h2 className="text-2xl sm:text-3xl font-light tracking-wide">Propiedades Exclusivas</h2>
                      <p className="text-neutral-400 text-sm max-w-sm mx-auto font-light">Descubre la colección más selecta de residencias de lujo en la Riviera Maya</p>
                      <div className="flex justify-center gap-3 pt-2">
                        <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-xs tracking-wide">EXPLORAR</Button>
                        <Button size="sm" variant="outline" className="text-white border-neutral-600 text-xs tracking-wide">CONCIERGE</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-900">
                    <p className="text-center text-xs tracking-[0.2em] text-neutral-500 mb-4 uppercase">Colección Destacada</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Villa Obsidiana", type: "Villa Frente al Mar", price: "$8,500" },
                        { name: "Penthouse Ámbar", type: "Penthouse Rooftop", price: "$5,200" },
                        { name: "Residencia Jade", type: "Casa en la Selva", price: "$4,800" }
                      ].map((prop, i) => (
                        <div key={i} className="group cursor-pointer">
                          <div className="aspect-[4/3] bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-600 rounded-sm flex items-center justify-center relative overflow-hidden">
                            <Building2 className="h-8 w-8 text-neutral-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                          <div className="mt-2 text-center">
                            <p className="font-light text-sm tracking-wide">{prop.name}</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{prop.type}</p>
                            <p className="text-rose-500 font-medium text-xs mt-1">{prop.price} USD/mes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-neutral-950 text-white border-t border-neutral-800">
                    <div className="flex justify-center gap-8">
                      {[
                        { label: "Villas", count: "45" },
                        { label: "Penthouses", count: "28" },
                        { label: "Beachfront", count: "15" },
                        { label: "Jungle", count: "32" }
                      ].map((cat, i) => (
                        <div key={i} className="text-center">
                          <p className="text-lg font-light text-rose-400">{cat.count}</p>
                          <p className="text-[9px] text-neutral-500 tracking-wider uppercase">{cat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 text-center text-xs text-muted-foreground bg-neutral-100 dark:bg-neutral-800 border-t">
                    <span className="font-medium text-rose-500">Diseño Elegante:</span> Lujo minimalista, tipografía refinada, paleta neutra con acentos rosa
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="minimal" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background max-h-[600px] overflow-y-auto">
                  <div className="bg-white dark:bg-slate-950 border-b">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                          <Home className="h-4 w-4 text-white dark:text-black" />
                        </div>
                        <span className="font-semibold text-lg">homes</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline">Buscar</span>
                        <span className="text-sm text-muted-foreground hidden sm:inline">Favoritos</span>
                        <Button size="sm" variant="outline" className="text-xs rounded-full">Entrar</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 text-center space-y-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold">Tu próximo hogar</h2>
                      <p className="text-muted-foreground text-sm">Propiedades en Tulum, Riviera Maya</p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-full border shadow-sm">
                        <Search className="h-4 w-4 text-muted-foreground ml-2" />
                        <input type="text" placeholder="¿Dónde quieres vivir?" className="flex-1 text-sm bg-transparent outline-none" />
                        <Button size="sm" className="rounded-full bg-black dark:bg-white text-white dark:text-black text-xs">Buscar</Button>
                      </div>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Badge variant="secondary" className="rounded-full text-xs">Aldea Zamá</Badge>
                      <Badge variant="secondary" className="rounded-full text-xs">La Veleta</Badge>
                      <Badge variant="secondary" className="rounded-full text-xs">Holistika</Badge>
                      <Badge variant="secondary" className="rounded-full text-xs">Centro</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Populares ahora</h3>
                      <Button variant="ghost" size="sm" className="text-xs">Ver más</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "Estudio Moderno", price: "$850", zone: "Centro", tag: "Nuevo" },
                        { name: "Depto 2 Rec", price: "$1,400", zone: "Zamá", tag: "Popular" }
                      ].map((prop, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border bg-card">
                          <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative">
                            <Building2 className="h-8 w-8 text-slate-400" />
                            <Badge className="absolute top-2 left-2 bg-black dark:bg-white text-white dark:text-black text-[9px] rounded-full">{prop.tag}</Badge>
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{prop.name}</p>
                                <p className="text-xs text-muted-foreground">{prop.zone}, Tulum</p>
                              </div>
                              <Heart className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="font-bold text-sm mt-2">{prop.price} <span className="font-normal text-xs text-muted-foreground">USD/mes</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-center gap-6 text-center">
                      <div>
                        <p className="font-bold text-lg">200+</p>
                        <p className="text-[10px] text-muted-foreground">Propiedades</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <p className="font-bold text-lg">4.9★</p>
                        <p className="text-[10px] text-muted-foreground">Calificación</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <p className="font-bold text-lg">24h</p>
                        <p className="text-[10px] text-muted-foreground">Respuesta</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 border-t">
                    <span className="font-medium">Diseño Minimalista:</span> Ultra limpio, bordes redondeados, estilo Airbnb/moderno
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-2">¿Cuál diseño prefieres? Dinos para implementarlo en el Home Page.</p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Moderno</Badge>
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Elegante</Badge>
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Minimalista</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
