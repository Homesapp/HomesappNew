import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lock, User, Key, Home, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getAccessInfoSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    accessType: z.enum(["unattended", "attended"]),
    method: z.enum(["lockbox", "smart_lock"]).optional(),
    lockboxCode: z.string().optional(),
    lockboxLocation: z.string().optional(),
    smartLockInstructions: z.string().optional(),
    smartLockProvider: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
    contactNotes: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.accessType === "unattended" && data.method === "lockbox" && !data.lockboxCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.step5.lockboxCodeRequired,
        path: ["lockboxCode"],
      });
    }
    if (data.accessType === "attended" && !data.contactPerson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.step5.contactNameRequired,
        path: ["contactPerson"],
      });
    }
    if (data.accessType === "attended" && !data.contactPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t.step5.contactPhoneRequired,
        path: ["contactPhone"],
      });
    }
  });
};

type AccessInfoForm = z.infer<ReturnType<typeof getAccessInfoSchema>>;

type Step5Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step5AccessInfo({ data = {}, onUpdate, onNext, onPrevious, language = "es" }: Step5Props) {
  const t = getTranslation(language);
  const accessInfoSchema = getAccessInfoSchema(language);
  const initialValues = data?.accessInfo ?? {
    accessType: "unattended" as const,
    method: "lockbox" as const,
    lockboxCode: "",
    lockboxLocation: "",
  };

  const form = useForm<AccessInfoForm>({
    resolver: zodResolver(accessInfoSchema),
    defaultValues: initialValues,
  });

  const accessType = form.watch("accessType");
  const method = form.watch("method");

  const onSubmit = (formData: AccessInfoForm) => {
    onNext({ accessInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          {t.step5.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          {t.step5.subtitle}
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t.step5.privacyTitle}
          </CardTitle>
          <CardDescription>
            {t.step5.privacyNotice}
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Acceso */}
          <FormField
            control={form.control}
            name="accessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step5.accessTypeLabel}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="unattended"
                        id="unattended"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="unattended"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="radio-unattended"
                      >
                        <Key className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">{t.step5.unattended}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t.step5.unattendedDesc}
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="attended"
                        id="attended"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="attended"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="radio-attended"
                      >
                        <User className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">{t.step5.attended}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t.step5.attendedDesc}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unattended Access Fields */}
          {accessType === "unattended" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step5.methodLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-access-method">
                          <SelectValue placeholder={t.step5.methodPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lockbox">{t.step5.lockbox}</SelectItem>
                        <SelectItem value="smart_lock">{t.step5.smartLock}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {method === "lockbox" && (
                <>
                  <FormField
                    control={form.control}
                    name="lockboxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step5.lockboxCodeLabel}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.step5.lockboxCodePlaceholder}
                            {...field}
                            data-testid="input-lockbox-code"
                          />
                        </FormControl>
                        <FormDescription>
                          {t.step5.lockboxCodeDesc}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lockboxLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step5.lockboxLocationLabel}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.step5.lockboxLocationPlaceholder}
                            {...field}
                            data-testid="input-lockbox-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {method === "smart_lock" && (
                <>
                  <FormField
                    control={form.control}
                    name="smartLockProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step5.smartLockProviderLabel}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.step5.smartLockProviderPlaceholder}
                            {...field}
                            data-testid="input-smart-lock-provider"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smartLockInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step5.smartLockInstructionsLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.step5.smartLockInstructionsPlaceholder}
                            {...field}
                            data-testid="textarea-smart-lock-instructions"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          {t.step5.smartLockInstructionsDesc}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          )}

          {/* Attended Access Fields */}
          {accessType === "attended" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step5.contactNameLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step5.contactNamePlaceholder}
                        {...field}
                        data-testid="input-contact-person"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step5.contactPhoneLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step5.contactPhonePlaceholder}
                        {...field}
                        data-testid="input-contact-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step5.contactNotesLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.step5.contactNotesPlaceholder}
                        {...field}
                        data-testid="textarea-contact-notes"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button
              type="submit"
              data-testid="button-next"
            >
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
