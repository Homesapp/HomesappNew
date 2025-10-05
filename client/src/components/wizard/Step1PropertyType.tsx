import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Home, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Step1Props = {
  data: {
    isForRent: boolean;
    isForSale: boolean;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
};

export default function Step1PropertyType({ data, onUpdate, onNext }: Step1Props) {
  const canProceed = data.isForRent || data.isForSale;

  const handleToggle = (type: "rent" | "sale") => {
    if (type === "rent") {
      onUpdate({ isForRent: !data.isForRent });
    } else {
      onUpdate({ isForSale: !data.isForSale });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step1-title">
          ¿Qué tipo de operación deseas realizar?
        </h2>
        <p className="text-muted-foreground" data-testid="text-step1-description">
          Selecciona si quieres rentar, vender o ambas opciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            data.isForRent ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleToggle("rent")}
          data-testid="card-rent-option"
        >
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Home className="w-16 h-16 text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold" data-testid="text-rent-title">Renta</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-rent-description">
                Ofrecer la propiedad en renta
              </p>
            </div>
            <Checkbox
              checked={data.isForRent}
              onCheckedChange={() => handleToggle("rent")}
              data-testid="checkbox-rent"
            />
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            data.isForSale ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleToggle("sale")}
          data-testid="card-sale-option"
        >
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Building2 className="w-16 h-16 text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold" data-testid="text-sale-title">Venta</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-sale-description">
                Ofrecer la propiedad en venta
              </p>
            </div>
            <Checkbox
              checked={data.isForSale}
              onCheckedChange={() => handleToggle("sale")}
              data-testid="checkbox-sale"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          data-testid="button-next-step1"
        >
          Continuar
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
