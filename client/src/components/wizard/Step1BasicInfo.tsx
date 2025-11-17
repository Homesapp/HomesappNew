import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Home, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getStep1Schema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    isForRent: z.boolean(),
    isForSale: z.boolean(),
    title: z.string().min(5, t.errors.titleMin),
    customListingTitle: z.string().max(60, t.errors.customListingTitleMax).optional().or(z.literal("")),
    description: z.string().min(20, t.errors.descriptionMin),
    propertyType: z.string().min(1, t.errors.propertyTypeRequired),
    price: z.string().min(1, t.errors.priceRequired),
  }).refine((data) => data.isForRent || data.isForSale, {
    message: t.errors.operationTypeRequired,
    path: ["isForRent"],
  });
};

type Step1Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  language?: Language;
};

export default function Step1BasicInfo({ data, onUpdate, onNext, language = "es" }: Step1Props) {
  const t = getTranslation(language);
  const step1Schema = getStep1Schema(language);
  type Step1Form = z.infer<typeof step1Schema>;

  const form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      isForRent: data.isForRent || false,
      isForSale: data.isForSale || false,
      title: data.basicInfo?.title || "",
      customListingTitle: data.basicInfo?.customListingTitle || "",
      description: data.basicInfo?.description || "",
      propertyType: data.basicInfo?.propertyType || "house",
      price: data.basicInfo?.price || "",
    },
  });

  const onSubmit = (formData: Step1Form) => {
    onNext({
      isForRent: formData.isForRent,
      isForSale: formData.isForSale,
      basicInfo: {
        title: formData.title,
        customListingTitle: formData.customListingTitle && formData.customListingTitle.trim() !== "" ? formData.customListingTitle : undefined,
        description: formData.description,
        propertyType: formData.propertyType,
        price: formData.price,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step1-title">
          {t.step1.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step1-description">
          {t.step1.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Operación */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step1.operationType}</h3>
              <p className="text-sm text-muted-foreground">
                {t.step1.operationTypeDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isForRent"
                render={({ field }) => (
                  <FormItem>
                    <Card 
                      className={`cursor-pointer transition-all hover-elevate ${
                        field.value ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid="card-rent-option"
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Home className="w-12 h-12 text-primary" />
                        <div className="text-center space-y-1">
                          <h4 className="font-semibold" data-testid="text-rent-title">
                            {t.step1.rent}
                          </h4>
                          <p className="text-xs text-muted-foreground" data-testid="text-rent-description">
                            {t.step1.rentDescription}
                          </p>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-rent"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isForSale"
                render={({ field }) => (
                  <FormItem>
                    <Card
                      className={`cursor-pointer transition-all hover-elevate ${
                        field.value ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid="card-sale-option"
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Building2 className="w-12 h-12 text-primary" />
                        <div className="text-center space-y-1">
                          <h4 className="font-semibold" data-testid="text-sale-title">
                            {t.step1.sale}
                          </h4>
                          <p className="text-xs text-muted-foreground" data-testid="text-sale-description">
                            {t.step1.saleDescription}
                          </p>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-sale"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />
            </div>

            {(form.formState.errors.isForRent || form.formState.errors.isForSale) && (
              <p className="text-sm text-destructive" data-testid="error-operation-type">
                {form.formState.errors.isForRent?.message || form.formState.errors.isForSale?.message}
              </p>
            )}
          </div>

          <Separator />

          {/* Información Básica */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step1.mainDetails}</h3>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.titleLabel} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step1.titlePlaceholder}
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customListingTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.customListingTitle}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step1.customListingTitlePlaceholder}
                      maxLength={60}
                      {...field}
                      data-testid="input-custom-listing-title"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t.step1.customListingTitleDescription}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.description} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.step1.descriptionPlaceholder}
                      rows={4}
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step1.propertyType} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property-type">
                          <SelectValue placeholder={t.step1.selectPropertyType} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="house" data-testid="option-property-house">
                          {t.step1.propertyTypes.house}
                        </SelectItem>
                        <SelectItem value="apartment" data-testid="option-property-apartment">
                          {t.step1.propertyTypes.apartment}
                        </SelectItem>
                        <SelectItem value="condo" data-testid="option-property-condo">
                          {t.step1.propertyTypes.condo}
                        </SelectItem>
                        <SelectItem value="land" data-testid="option-property-land">
                          {t.step1.propertyTypes.land}
                        </SelectItem>
                        <SelectItem value="commercial" data-testid="option-property-commercial">
                          {t.step1.propertyTypes.commercial}
                        </SelectItem>
                        <SelectItem value="office" data-testid="option-property-office">
                          {t.step1.propertyTypes.office}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step1.price} *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={t.step1.pricePlaceholder}
                        {...field}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full sm:w-auto" data-testid="button-next-step1">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
