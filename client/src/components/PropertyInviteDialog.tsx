import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Check, Link2, Mail, Phone, User } from "lucide-react";

interface PropertyInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyInviteDialog({ open, onOpenChange }: PropertyInviteDialogProps) {
  const { toast } = useToast();
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteePhone, setInviteePhone] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/property-tokens", {
        inviteeName: inviteeName || undefined,
        inviteeEmail: inviteeEmail || undefined,
        inviteePhone: inviteePhone || undefined,
      });
    },
    onSuccess: (data: any) => {
      setGeneratedLink(data.inviteUrl);
      toast({
        title: "Link generado",
        description: "El link de invitación se ha generado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el link",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({
      title: "Copiado",
      description: "El link se ha copiado al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setInviteeName("");
    setInviteeEmail("");
    setInviteePhone("");
    setGeneratedLink("");
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleReset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[550px]" data-testid="dialog-property-invite">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Generar Link de Invitación
          </DialogTitle>
          <DialogDescription>
            Crea un link privado para que un propietario pueda subir su propiedad sin necesidad de crear una cuenta. El link expira en 24 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="inviteeName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre del Propietario (opcional)
                </Label>
                <Input
                  id="inviteeName"
                  placeholder="Juan Pérez"
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  data-testid="input-invitee-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteeEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email (opcional)
                </Label>
                <Input
                  id="inviteeEmail"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                  data-testid="input-invitee-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteePhone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono/WhatsApp (opcional)
                </Label>
                <Input
                  id="inviteePhone"
                  placeholder="+52 998 123 4567"
                  value={inviteePhone}
                  onChange={(e) => setInviteePhone(e.target.value)}
                  data-testid="input-invitee-phone"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid="button-generate-link"
              >
                <Link2 className="w-4 h-4" />
                {generateMutation.isPending ? "Generando..." : "Generar Link"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">¡Link generado exitosamente!</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                        Comparte este link con el propietario
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Link de Invitación</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="font-mono text-sm bg-muted"
                      data-testid="input-generated-link"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      data-testid="button-copy-link"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⏱️ Este link expira en 24 horas y solo puede usarse una vez
                    </p>
                  </div>
                </div>

                {inviteePhone && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-green-200 dark:border-green-800"
                    onClick={() => {
                      const message = encodeURIComponent(
                        `Hola${inviteeName ? ` ${inviteeName}` : ''}! Te comparto este link para que puedas subir tu propiedad a nuestra plataforma. El link expira en 24 horas:\n\n${generatedLink}`
                      );
                      window.open(`https://wa.me/${inviteePhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                    }}
                    data-testid="button-send-whatsapp"
                  >
                    <Phone className="w-4 h-4" />
                    Enviar por WhatsApp
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                  data-testid="button-generate-another"
                >
                  Generar Otro
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-close-dialog"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
