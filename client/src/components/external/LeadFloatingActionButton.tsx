import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadFloatingActionButtonProps {
  visible: boolean;
  onClick: () => void;
  label?: string;
}

export function LeadFloatingActionButton({
  visible,
  onClick,
  label = "Agregar",
}: LeadFloatingActionButtonProps) {
  const isMobile = useIsMobile();
  
  // Only show FAB on mobile devices
  if (!visible || !isMobile) return null;

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      onClick={onClick}
      data-testid="button-fab-primary"
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
