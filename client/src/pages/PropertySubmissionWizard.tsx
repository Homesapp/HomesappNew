import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Save, CheckCircle } from "lucide-react";
import type { PropertySubmissionDraft } from "@shared/schema";
import type { Language } from "@/lib/wizardTranslations";
import { getTranslation } from "@/lib/wizardTranslations";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

import Step1BasicInfo from "@/components/wizard/Step1BasicInfo";
import Step2LocationDetails from "@/components/wizard/Step2LocationDetails";
import Step3Media from "@/components/wizard/Step5Media";
import Step4Services from "@/components/wizard/Step4Services";
import Step5AccessInfo from "@/components/wizard/Step5AccessInfo";
import Step6OwnerData from "@/components/wizard/Step6OwnerData";
import Step7TermsReview from "@/components/wizard/Step5TermsReview";

const TOTAL_STEPS = 7;

type WizardData = {
  isForRent: boolean;
  isForSale: boolean;
  basicInfo?: any;
  locationInfo?: any;
  details?: any;
  media?: any;
  servicesInfo?: any;
  accessInfo?: any;
  ownerData?: any;
  commercialTerms?: any;
};

interface PropertySubmissionWizardProps {
  invitationToken?: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  inviteeName?: string;
  language?: Language;
}

export default function PropertySubmissionWizard({ 
  invitationToken,
  inviteeEmail,
  inviteePhone,
  inviteeName,
  language = "es"
}: PropertySubmissionWizardProps = {}) {
  const t = getTranslation(language);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<WizardData>({
    isForRent: false,
    isForSale: false,
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<WizardData | null>(null);
  const [lastSavedStep, setLastSavedStep] = useState<number | null>(null);

  // Fetch existing draft if there's one in progress
  // SECURITY: Disable authenticated draft fetching when using invitation token
  const { data: existingDrafts } = useQuery<PropertySubmissionDraft[]>({
    queryKey: ["/api/property-submission-drafts"],
    enabled: !invitationToken, // Only fetch when NOT using invitation token
  });

  // Fetch draft linked to invitation token
  const { data: tokenDraft } = useQuery<PropertySubmissionDraft | null>({
    queryKey: ["/api/property-tokens", invitationToken, "draft"],
    queryFn: async () => {
      if (!invitationToken) return null;
      const response = await fetch(`/api/property-tokens/${invitationToken}/draft`);
      if (!response.ok) {
        // If 404, no draft exists yet (which is fine)
        if (response.status === 404) return null;
        throw new Error("Failed to fetch draft");
      }
      return response.json();
    },
    enabled: !!invitationToken,
  });

  // Load existing draft if found (for authenticated users)
  // SECURITY: Skip loading authenticated drafts when using invitation token
  useEffect(() => {
    if (!invitationToken && existingDrafts && existingDrafts.length > 0) {
      const draft = existingDrafts.find(d => d.status === "draft");
      if (draft) {
        setDraftId(draft.id);
        setCurrentStep(draft.currentStep);
        setWizardData({
          isForRent: draft.isForRent,
          isForSale: draft.isForSale,
          basicInfo: draft.basicInfo,
          locationInfo: draft.locationInfo,
          details: draft.details,
          media: draft.media,
          servicesInfo: draft.servicesInfo,
          accessInfo: draft.accessInfo,
          ownerData: draft.ownerData,
          commercialTerms: draft.commercialTerms,
        });
        // Set last saved to show the indicator after reload
        if (draft.updatedAt) {
          setLastSaved(new Date(draft.updatedAt));
        }
        // Track the loaded data and step as last saved
        setLastSavedStep(draft.currentStep);
        setLastSavedData({
          isForRent: draft.isForRent,
          isForSale: draft.isForSale,
          basicInfo: draft.basicInfo,
          locationInfo: draft.locationInfo,
          details: draft.details,
          media: draft.media,
          servicesInfo: draft.servicesInfo,
          accessInfo: draft.accessInfo,
          ownerData: draft.ownerData,
          commercialTerms: draft.commercialTerms,
        });
      }
    }
  }, [existingDrafts, invitationToken]);

  // Load existing draft linked to invitation token
  useEffect(() => {
    if (invitationToken && tokenDraft) {
      setDraftId(tokenDraft.id);
      setCurrentStep(tokenDraft.currentStep);
      setWizardData({
        isForRent: tokenDraft.isForRent,
        isForSale: tokenDraft.isForSale,
        basicInfo: tokenDraft.basicInfo,
        locationInfo: tokenDraft.locationInfo,
        details: tokenDraft.details,
        media: tokenDraft.media,
        servicesInfo: tokenDraft.servicesInfo,
        accessInfo: tokenDraft.accessInfo,
        ownerData: tokenDraft.ownerData,
        commercialTerms: tokenDraft.commercialTerms,
      });
      // Set last saved to show the indicator after reload
      if (tokenDraft.updatedAt) {
        setLastSaved(new Date(tokenDraft.updatedAt));
      }
      // Track the loaded data and step as last saved
      setLastSavedStep(tokenDraft.currentStep);
      setLastSavedData({
        isForRent: tokenDraft.isForRent,
        isForSale: tokenDraft.isForSale,
        basicInfo: tokenDraft.basicInfo,
        locationInfo: tokenDraft.locationInfo,
        details: tokenDraft.details,
        media: tokenDraft.media,
        servicesInfo: tokenDraft.servicesInfo,
        accessInfo: tokenDraft.accessInfo,
        ownerData: tokenDraft.ownerData,
        commercialTerms: tokenDraft.commercialTerms,
      });
    }
  }, [tokenDraft, invitationToken]);

  // Create draft mutation
  const createDraftMutation = useMutation<PropertySubmissionDraft, Error, Partial<WizardData> & { currentStep: number }>({
    mutationFn: async (data: Partial<WizardData> & { currentStep: number }) => {
      if (invitationToken) {
        // Use public endpoint for token-based submissions
        const payload = { ...data, invitationToken };
        const response = await apiRequest("POST", "/api/public/property-submission-drafts", payload);
        const json = await response.json();
        return json;
      } else {
        // Use authenticated endpoint for regular submissions
        const response = await apiRequest("POST", "/api/property-submission-drafts", data);
        const json = await response.json();
        return json;
      }
    },
    onSuccess: (data: PropertySubmissionDraft) => {
      setDraftId(data.id);
      setLastSaved(new Date());
      setIsSaving(false);
      // Update lastSavedData and step to track what's persisted
      setLastSavedStep(data.currentStep);
      setLastSavedData({
        isForRent: data.isForRent,
        isForSale: data.isForSale,
        basicInfo: data.basicInfo,
        locationInfo: data.locationInfo,
        details: data.details,
        media: data.media,
        servicesInfo: data.servicesInfo,
        accessInfo: data.accessInfo,
        ownerData: data.ownerData,
        commercialTerms: data.commercialTerms,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-submission-drafts"] });
    },
    onError: (error: Error) => {
      console.error("Error creating draft:", error);
      setIsSaving(false);
      toast({
        title: language === "es" ? "Error al guardar borrador" : "Error saving draft",
        description: error.message || (language === "es" ? "No se pudo crear el borrador de la propiedad" : "Could not create property draft"),
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update draft mutation
  const updateDraftMutation = useMutation<PropertySubmissionDraft, Error, { id: string; data: Partial<WizardData> & { currentStep?: number } }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WizardData> & { currentStep?: number } }) => {
      if (invitationToken) {
        // Use public endpoint for token-based submissions
        const payload = { ...data, invitationToken };
        const response = await apiRequest("PATCH", `/api/public/property-submission-drafts/${id}`, payload);
        const json = await response.json();
        return json;
      } else {
        // Use authenticated endpoint for regular submissions
        const response = await apiRequest("PATCH", `/api/property-submission-drafts/${id}`, data);
        const json = await response.json();
        return json;
      }
    },
    onSuccess: (data: PropertySubmissionDraft) => {
      setLastSaved(new Date());
      setIsSaving(false);
      // Update lastSavedData and step to track what's persisted
      setLastSavedStep(data.currentStep);
      setLastSavedData({
        isForRent: data.isForRent,
        isForSale: data.isForSale,
        basicInfo: data.basicInfo,
        locationInfo: data.locationInfo,
        details: data.details,
        media: data.media,
        servicesInfo: data.servicesInfo,
        accessInfo: data.accessInfo,
        ownerData: data.ownerData,
        commercialTerms: data.commercialTerms,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-submission-drafts"] });
    },
    onError: (error: Error) => {
      console.error("Error updating draft:", error);
      setIsSaving(false);
      toast({
        title: "Error al guardar progreso",
        description: error.message || "No se pudo actualizar el borrador de la propiedad",
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Check if data has changed
  const hasDataChanged = useCallback((newData: WizardData, step: number) => {
    if (!lastSavedData) return true; // No previous save, must save
    
    // Deep comparison of wizard data (excluding currentStep)
    return JSON.stringify({
      isForRent: newData.isForRent,
      isForSale: newData.isForSale,
      basicInfo: newData.basicInfo,
      locationInfo: newData.locationInfo,
      details: newData.details,
      media: newData.media,
      servicesInfo: newData.servicesInfo,
      accessInfo: newData.accessInfo,
      ownerData: newData.ownerData,
      commercialTerms: newData.commercialTerms,
    }) !== JSON.stringify({
      isForRent: lastSavedData.isForRent,
      isForSale: lastSavedData.isForSale,
      basicInfo: lastSavedData.basicInfo,
      locationInfo: lastSavedData.locationInfo,
      details: lastSavedData.details,
      media: lastSavedData.media,
      servicesInfo: lastSavedData.servicesInfo,
      accessInfo: lastSavedData.accessInfo,
      ownerData: lastSavedData.ownerData,
      commercialTerms: lastSavedData.commercialTerms,
    });
  }, [lastSavedData]);

  // Save function - accepts optional step number to save
  const saveDraft = useCallback(async (stepToSave?: number) => {
    if (isSaving) return;

    const targetStep = stepToSave !== undefined ? stepToSave : currentStep;
    
    // Check if either step or data has changed
    const stepChanged = lastSavedStep !== targetStep;
    const dataChanged = hasDataChanged(wizardData, targetStep);
    
    // Skip save if neither step nor data changed
    if (!stepChanged && !dataChanged && draftId) {
      console.log("No changes detected (step or data), skipping save");
      return;
    }

    setIsSaving(true);
    const dataToSave = {
      ...wizardData,
      currentStep: targetStep,
    };

    try {
      if (draftId) {
        await updateDraftMutation.mutateAsync({ id: draftId, data: dataToSave });
      } else {
        const newDraft = await createDraftMutation.mutateAsync(dataToSave);
        setDraftId(newDraft.id);
      }
      setLastSaved(new Date());
    } catch (error: any) {
      console.error("Save failed:", error);
      toast({
        title: "Error al guardar",
        description: error?.message || "No se pudo guardar el progreso. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [wizardData, currentStep, draftId, isSaving, lastSavedStep, hasDataChanged, toast, updateDraftMutation, createDraftMutation]);

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = async (stepData?: Partial<WizardData>) => {
    if (currentStep < TOTAL_STEPS) {
      // Update wizard data with latest changes
      const updatedData = stepData ? { ...wizardData, ...stepData } : wizardData;
      if (stepData) {
        setWizardData(updatedData);
      }
      
      const nextStep = currentStep + 1;
      
      // Check if data or step has changed
      const stepChanged = lastSavedStep !== nextStep;
      const dataChanged = hasDataChanged(updatedData, nextStep);
      
      // Only save if there are changes or no draft exists
      if (stepChanged || dataChanged || !draftId) {
        setIsSaving(true);
        const dataToSave = {
          ...updatedData,
          currentStep: nextStep,
        };

        try {
          if (draftId) {
            await updateDraftMutation.mutateAsync({ id: draftId, data: dataToSave });
          } else {
            const newDraft = await createDraftMutation.mutateAsync(dataToSave);
            setDraftId(newDraft.id);
          }
          setLastSaved(new Date());
        } catch (error: any) {
          console.error("Save failed:", error);
          toast({
            title: language === "es" ? "Error al avanzar" : "Error advancing",
            description: error?.message || (language === "es" ? "No se pudo guardar y avanzar al siguiente paso" : "Could not save and advance to the next step"),
            variant: "destructive",
          });
          setIsSaving(false);
          return; // Don't advance if save failed
        } finally {
          setIsSaving(false);
        }
      }
      
      // Always advance to next step (whether we saved or not)
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      
      // Check if data or step has changed before saving
      const stepChanged = lastSavedStep !== prevStep;
      const dataChanged = hasDataChanged(wizardData, prevStep);
      
      // Only save if there are changes
      if (stepChanged || dataChanged) {
        await saveDraft(prevStep);
      }
      
      // Always move to previous step
      setCurrentStep(prevStep);
    }
  };

  const handleManualSave = async () => {
    await saveDraft(currentStep);
    toast({
      title: language === "es" ? "Progreso guardado" : "Progress saved",
      description: language === "es" ? "Tu progreso ha sido guardado exitosamente" : "Your progress has been saved successfully",
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            language={language}
          />
        );
      case 2:
        return (
          <Step2LocationDetails
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
            language={language}
          />
        );
      case 3:
        return (
          <Step3Media
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
            language={language}
          />
        );
      case 4:
        return (
          <Step4Services
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
            language={language}
          />
        );
      case 5:
        return (
          <Step5AccessInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
            language={language}
          />
        );
      case 6:
        return (
          <Step6OwnerData
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
            language={language}
          />
        );
      case 7:
        return (
          <Step7TermsReview
            data={wizardData}
            draftId={draftId}
            onUpdate={updateWizardData}
            onPrevious={handlePrevious}
            invitationToken={invitationToken}
            language={language}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle data-testid="heading-wizard-title">{t.title}</CardTitle>
                <CardDescription className="mt-2" data-testid="text-wizard-description">
                  {t.step} {currentStep} {t.of} {TOTAL_STEPS}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-saving">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span>{t.saving}</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="text-last-saved">
                    <CheckCircle className="w-3 h-3" />
                    <span>{t.saved} {new Date(lastSaved).toLocaleTimeString()}</span>
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  data-testid="button-manual-save"
                >
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t.save}</span>
                </Button>
              </div>
            </div>
            <Progress value={progress} data-testid="progress-wizard" />
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            {renderStep()}
          </CardContent>
        </Card>
      </div>

      {/* Saving Modal */}
      <Dialog open={isSaving} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <img 
              src={logoPath} 
              alt="HomesApp" 
              className="h-20 w-auto animate-pulse-color"
              data-testid="img-saving-logo"
            />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold" data-testid="text-saving-title">
                {language === "es" ? "Guardando información..." : "Saving information..."}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-saving-message">
                {language === "es" 
                  ? "Por favor espera mientras guardamos tu progreso" 
                  : "Please wait while we save your progress"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
