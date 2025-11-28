import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ExternalLead } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

type LeadStatus =
  | "nuevo_lead"
  | "cita_coordinada"
  | "interesado"
  | "oferta_enviada"
  | "oferta_completada"
  | "formato_enviado"
  | "formato_completado"
  | "proceso_renta"
  | "renta_concretada"
  | "perdido"
  | "muerto";

interface LeadKanbanViewProps {
  leads: ExternalLead[];
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  onViewDetail?: (lead: ExternalLead) => void;
}

interface KanbanColumnDef {
  id: LeadStatus;
  labelEs: string;
  labelEn: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: "nuevo_lead", labelEs: "Nuevo Lead", labelEn: "New Lead" },
  { id: "cita_coordinada", labelEs: "Cita Coordinada", labelEn: "Appointment Scheduled" },
  { id: "interesado", labelEs: "Interesado", labelEn: "Interested" },
  { id: "oferta_enviada", labelEs: "Oferta Enviada", labelEn: "Offer Sent" },
  { id: "oferta_completada", labelEs: "Oferta Completada", labelEn: "Offer Completed" },
  { id: "formato_enviado", labelEs: "Formato Enviado", labelEn: "Form Sent" },
  { id: "formato_completado", labelEs: "Formato Completado", labelEn: "Form Completed" },
  { id: "proceso_renta", labelEs: "Proceso de Renta", labelEn: "Rental Process" },
  { id: "renta_concretada", labelEs: "Renta Concretada", labelEn: "Rental Completed" },
  { id: "perdido", labelEs: "Lead Perdido", labelEn: "Lead Lost" },
  { id: "muerto", labelEs: "Lead Muerto", labelEn: "Dead Lead" },
];

function DroppableColumn({
  id,
  label,
  count,
  children,
}: {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 rounded-lg border-2 p-4 transition-colors",
        isOver ? "border-primary bg-accent/50" : "border-border bg-card"
      )}
      data-testid={`kanban-column-${id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-3 min-h-[200px]">{children}</div>
    </div>
  );
}

function DraggableLeadCard({
  lead,
  onEdit,
  onDelete,
  isDragging = false,
}: {
  lead: ExternalLead;
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  isDragging?: boolean;
}) {
  const { language } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover-elevate cursor-grab active:cursor-grabbing",
        (isDragging || dragging) && "opacity-50"
      )}
      data-testid={`lead-card-${lead.id}`}
      {...listeners}
      {...attributes}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium truncate">
            {lead.firstName} {lead.lastName}
          </CardTitle>
          <Badge variant="outline" className="mt-1 text-xs">
            {lead.registrationType === "broker" 
              ? (language === "es" ? "Broker" : "Broker") 
              : (language === "es" ? "Vendedor" : "Seller")}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-lead-actions-${lead.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(lead)} data-testid={`button-edit-lead-${lead.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {language === "es" ? "Editar" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(lead)}
              className="text-destructive"
              data-testid={`button-delete-lead-${lead.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {language === "es" ? "Eliminar" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {lead.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.phoneLast4 && !lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>*** {lead.phoneLast4}</span>
          </div>
        )}
        {lead.createdAt && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
            <span>{format(new Date(lead.createdAt), "d MMM yyyy", { locale: language === "es" ? es : undefined })}</span>
          </div>
        )}
        {lead.notes && (
          <p className="text-muted-foreground line-clamp-2 mt-2 pt-2 border-t">
            {lead.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MobileLeadCard({
  lead,
  onEdit,
  onDelete,
  onUpdateStatus,
}: {
  lead: ExternalLead;
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
}) {
  const { language } = useLanguage();

  return (
    <Card className="hover-elevate" data-testid={`mobile-lead-card-${lead.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium">
              {lead.firstName} {lead.lastName}
            </CardTitle>
            <Badge variant="outline" className="mt-1 text-xs">
              {lead.registrationType === "broker" 
                ? "Broker" 
                : (language === "es" ? "Vendedor" : "Seller")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.phoneLast4 && !lead.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>*** {lead.phoneLast4}</span>
          </div>
        )}
        
        {/* Status Selector for Mobile */}
        <div className="pt-2 border-t">
          <label className="text-xs text-muted-foreground mb-1 block">
            {language === "es" ? "Cambiar Estado" : "Change Status"}
          </label>
          <Select
            value={lead.status}
            onValueChange={(value) => onUpdateStatus(lead.id, value as LeadStatus)}
          >
            <SelectTrigger className="h-10 text-sm" data-testid={`select-status-${lead.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {language === "es" ? col.labelEs : col.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {lead.phone && lead.registrationType !== "broker" && (
            <Button
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const phone = lead.phone?.replace(/\D/g, '');
                window.open(`https://wa.me/${phone}`, '_blank');
              }}
              data-testid={`button-whatsapp-mobile-${lead.id}`}
            >
              <SiWhatsapp className="h-5 w-5 mr-2" />
              WhatsApp
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11 min-w-11"
            size="icon"
            onClick={() => onEdit(lead)}
            data-testid={`button-edit-mobile-${lead.id}`}
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="h-11 min-w-11"
            size="icon"
            onClick={() => onDelete(lead)}
            data-testid={`button-delete-mobile-${lead.id}`}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileKanbanColumn({
  column,
  leads,
  onEdit,
  onDelete,
  onUpdateStatus,
  language,
}: {
  column: KanbanColumnDef;
  leads: ExternalLead[];
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  language: string;
}) {
  const [isOpen, setIsOpen] = useState(leads.length > 0);
  const label = language === "es" ? column.labelEs : column.labelEn;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-12 px-4 rounded-lg bg-muted/50 hover:bg-muted"
          data-testid={`mobile-column-trigger-${column.id}`}
        >
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">{label}</span>
          </div>
          <Badge variant={leads.length > 0 ? "default" : "secondary"} className="text-xs">
            {leads.length}
          </Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "es" ? "Sin leads en esta etapa" : "No leads in this stage"}
          </p>
        ) : (
          leads.map((lead) => (
            <MobileLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function LeadKanbanView({
  leads,
  onUpdateStatus,
  onEdit,
  onDelete,
}: LeadKanbanViewProps) {
  const { language } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStatus = over.id as LeadStatus;
      onUpdateStatus(leadId, newStatus);
    }

    setActiveId(null);
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  // Mobile view: Collapsible columns with optimized cards
  if (isMobile) {
    return (
      <div className="space-y-3 pb-20">
        {KANBAN_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          return (
            <MobileKanbanColumn
              key={column.id}
              column={column}
              leads={columnLeads}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              language={language}
            />
          );
        })}
      </div>
    );
  }

  // Desktop view: Horizontal drag-and-drop columns
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          const label = language === "es" ? column.labelEs : column.labelEn;
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              label={label}
              count={columnLeads.length}
            >
              {columnLeads.map((lead) => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDragging={activeId === lead.id}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <DraggableLeadCard lead={activeLead} onEdit={onEdit} onDelete={onDelete} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
