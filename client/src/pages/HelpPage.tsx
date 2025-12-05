import { useAuth } from "@/hooks/useAuth";
import { getRoleHelpContent, type RoleHelpContent } from "@/lib/helpContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  ListChecks, 
  ArrowRight,
  MessageCircle,
  Lightbulb,
  Target
} from "lucide-react";

function WorkflowDiagram({ workflow }: { workflow: RoleHelpContent["workflow"] }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflow.map((step, index) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.step} 
              className="relative flex flex-col items-center p-4 bg-card border rounded-lg"
              data-testid={`workflow-step-${step.step}`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                <Icon className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="mb-2">Paso {step.step}</Badge>
              <h4 className="font-semibold text-center mb-1">{step.title}</h4>
              <p className="text-sm text-muted-foreground text-center">{step.description}</p>
              {index < workflow.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FirstStepsList({ steps }: { steps: RoleHelpContent["firstSteps"] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className="flex gap-4 p-4 bg-muted/50 rounded-lg"
          data-testid={`first-step-${index}`}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1">{step.title}</h4>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ section }: { section: RoleHelpContent["sections"][0] }) {
  const Icon = section.icon;
  
  return (
    <Card data-testid={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {section.title}
        </CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {section.steps && section.steps.length > 0 && (
          <div className="space-y-3">
            {section.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium">{step.title}</h5>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FAQSection({ faqs }: { faqs: RoleHelpContent["faqs"] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, idx) => (
        <AccordionItem key={idx} value={`faq-${idx}`} data-testid={`faq-item-${idx}`}>
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{faq.question}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground pl-6">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function HelpPage() {
  const { user } = useAuth();
  
  const userRole = user?.role || "seller";
  const helpContent = getRoleHelpContent(userRole);

  return (
    <div className="container mx-auto py-6 px-4 space-y-8 max-w-5xl">
      <div className="space-y-2" data-testid="help-header">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Centro de Ayuda
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {helpContent.roleTitle}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          {helpContent.roleDescription}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2" data-testid="tab-overview">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2 py-2" data-testid="tab-workflow">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Flujo de Trabajo</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2 py-2" data-testid="tab-sections">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Secciones</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 py-2" data-testid="tab-faq">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card data-testid="what-can-i-do-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                ¿Qué puedo hacer con este rol?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {helpContent.whatCanIDo.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="first-steps-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Primeros Pasos
              </CardTitle>
              <CardDescription>
                Sigue estos pasos para comenzar a usar la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FirstStepsList steps={helpContent.firstSteps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <Card data-testid="workflow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Flujo de Trabajo Típico
              </CardTitle>
              <CardDescription>
                Así es como normalmente trabajarás en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowDiagram workflow={helpContent.workflow} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {helpContent.sections.map((section, index) => (
              <SectionCard key={index} section={section} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card data-testid="faq-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Preguntas Frecuentes
              </CardTitle>
              <CardDescription>
                Respuestas a las dudas más comunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FAQSection faqs={helpContent.faqs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-primary/5 border-primary/20" data-testid="support-card">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">¿Necesitas más ayuda?</h3>
              <p className="text-sm text-muted-foreground">
                Contacta a nuestro equipo de soporte si tienes dudas adicionales
              </p>
            </div>
          </div>
          <a 
            href="mailto:soporte@tulumrentalhomes.com" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover-elevate active-elevate-2 h-10 px-4 py-2"
            data-testid="link-contact-support"
          >
            Contactar Soporte
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
