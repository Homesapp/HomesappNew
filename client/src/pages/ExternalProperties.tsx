import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalPropertySchema } from "@shared/schema";
import type { ExternalProperty } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const formSchema = insertExternalPropertySchema.omit({ agencyId: true });

export default function ExternalProperties() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ExternalProperty | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties, isLoading } = useQuery<ExternalProperty[]>({
    queryKey: ['/api/external-properties'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "",
      bedrooms: 0,
      bathrooms: 0,
      squareMeters: 0,
      monthlyRent: 0,
      currency: "MXN",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      propertyId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (editingProperty) {
        return await apiRequest("PATCH", `/api/external-properties/${editingProperty.id}`, data);
      }
      return await apiRequest("POST", "/api/external-properties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-properties'] });
      toast({
        title: language === "es" ? "Propiedad guardada" : "Property saved",
        description: language === "es" 
          ? "La propiedad ha sido guardada exitosamente"
          : "Property has been saved successfully",
      });
      setIsDialogOpen(false);
      setEditingProperty(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo guardar la propiedad"
          : "Could not save property",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external-properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-properties'] });
      toast({
        title: language === "es" ? "Propiedad eliminada" : "Property deleted",
        description: language === "es" 
          ? "La propiedad ha sido eliminada exitosamente"
          : "Property has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar la propiedad"
          : "Could not delete property",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (property: ExternalProperty) => {
    setEditingProperty(property);
    form.reset({
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode || "",
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareMeters: property.squareMeters,
      monthlyRent: property.monthlyRent,
      currency: property.currency,
      ownerName: property.ownerName,
      ownerEmail: property.ownerEmail || "",
      ownerPhone: property.ownerPhone || "",
      propertyId: property.propertyId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === "es" ? "¿Estás seguro de eliminar esta propiedad?" : "Are you sure you want to delete this property?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const filteredProperties = properties?.filter((property) => {
    const search = searchTerm.toLowerCase();
    return (
      property.address?.toLowerCase().includes(search) ||
      property.city?.toLowerCase().includes(search) ||
      property.ownerName?.toLowerCase().includes(search) ||
      (property.ownerEmail || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Propiedades Externas" : "External Properties"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Administra tu portafolio de propiedades externas"
              : "Manage your external properties portfolio"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProperty(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-property">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Agregar Propiedad" : "Add Property"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty 
                  ? (language === "es" ? "Editar Propiedad" : "Edit Property")
                  : (language === "es" ? "Agregar Propiedad" : "Add Property")}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Completa la información de la propiedad"
                  : "Fill in the property information"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Ciudad" : "City"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Estado" : "State"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Código Postal" : "Zip Code"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Tipo" : "Type"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-property-type" placeholder={language === "es" ? "Ej: Casa, Departamento" : "E.g.: House, Apartment"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Habitaciones" : "Bedrooms"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-bedrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Baños" : "Bathrooms"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-bathrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="squareMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "m²" : "sq m"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-square-meters" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Renta Mensual" : "Monthly Rent"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-monthly-rent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Moneda" : "Currency"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-currency" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{language === "es" ? "Nombre del Propietario" : "Owner Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Email del Propietario" : "Owner Email"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-owner-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Teléfono del Propietario" : "Owner Phone"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-owner-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-property">
                    {createMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar" : "Save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Lista de Propiedades" : "Properties List"}
          </CardTitle>
          <CardDescription>
            <Input
              placeholder={language === "es" ? "Buscar por dirección, ciudad o propietario..." : "Search by address, city or owner..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-properties"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <div className="space-y-3">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="hover-elevate" data-testid={`property-card-${property.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{property.address}</h3>
                          {property.propertyId && (
                            <Badge variant="outline" className="ml-2">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {language === "es" ? "Vinculado" : "Linked"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {property.city}, {property.state} {property.zipCode && `• ${property.zipCode}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>{property.bedrooms} {language === "es" ? "hab" : "bed"}</span>
                          <span>{property.bathrooms} {language === "es" ? "baños" : "bath"}</span>
                          <span>{property.squareMeters} m²</span>
                          <span className="font-bold text-primary">
                            ${property.monthlyRent.toLocaleString()} {property.currency}/{language === "es" ? "mes" : "mo"}
                          </span>
                        </div>
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">{language === "es" ? "Propietario:" : "Owner:"}</span> {property.ownerName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(property)}
                          data-testid={`button-edit-${property.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => handleDelete(property.id)}
                          data-testid={`button-delete-${property.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === "es" ? "No hay propiedades registradas" : "No properties registered"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
