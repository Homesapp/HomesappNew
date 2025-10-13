import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Save, CheckCircle } from "lucide-react";
import type { PropertySubmissionDraft } from "@shared/schema";

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

export default function PropertySubmissionWizard() {
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

  // Fetch existing draft if there's one in progress
  const { data: existingDrafts } = useQuery<PropertySubmissionDraft[]>({
    queryKey: ["/api/property-submission-drafts"],
  });

  // Load existing draft if found
  useEffect(() => {
    if (existingDrafts && existingDrafts.length > 0) {
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
      }
    }
  }, [existingDrafts]);

  // Create draft mutation
  const createDraftMutation = useMutation<PropertySubmissionDraft, Error, Partial<WizardData> & { currentStep: number }>({
    mutationFn: async (data: Partial<WizardData> & { currentStep: number }) => {
      const response = await apiRequest("POST", "/api/property-submission-drafts", data);
      const json = await response.json();
      return json;
    },
    onSuccess: (data: PropertySubmissionDraft) => {
      setDraftId(data.id);
      setLastSaved(new Date());
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: ["/api/property-submission-drafts"] });
    },
    onError: (error: Error) => {
      console.error("Error creating draft:", error);
      setIsSaving(false);
      toast({
        title: "Error al guardar borrador",
        description: error.message || "No se pudo crear el borrador de la propiedad",
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update draft mutation
  const updateDraftMutation = useMutation<PropertySubmissionDraft, Error, { id: string; data: Partial<WizardData> & { currentStep?: number } }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WizardData> & { currentStep?: number } }) => {
      const response = await apiRequest("PATCH", `/api/property-submission-drafts/${id}`, data);
      const json = await response.json();
      return json;
    },
    onSuccess: (data: PropertySubmissionDraft) => {
      setLastSaved(new Date());
      setIsSaving(false);
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

  // Save function - accepts optional step number to save
  const saveDraft = useCallback(async (stepToSave?: number) => {
    if (isSaving) return;

    setIsSaving(true);
    const dataToSave = {
      ...wizardData,
      currentStep: stepToSave !== undefined ? stepToSave : currentStep,
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
  }, [wizardData, currentStep, draftId, isSaving, toast, updateDraftMutation, createDraftMutation]);

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
      // Save with next step number and updated data
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
        setCurrentStep(nextStep);
      } catch (error: any) {
        console.error("Save failed:", error);
        toast({
          title: "Error al avanzar",
          description: error?.message || "No se pudo guardar y avanzar al siguiente paso",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      // Save with previous step number
      await saveDraft(prevStep);
      setCurrentStep(prevStep);
    }
  };

  const handleManualSave = async () => {
    await saveDraft(currentStep);
    toast({
      title: "Progreso guardado",
      description: "Tu progreso ha sido guardado exitosamente",
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
          />
        );
      case 2:
        return (
          <Step2LocationDetails
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <Step3Media
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <Step4Services
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <Step5AccessInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <Step6OwnerData
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={(stepData) => handleNext(stepData)}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <Step7TermsReview
            data={wizardData}
            draftId={draftId}
            onUpdate={updateWizardData}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle data-testid="heading-wizard-title">Cargar Nueva Propiedad</CardTitle>
              <CardDescription className="mt-2" data-testid="text-wizard-description">
                Paso {currentStep} de {TOTAL_STEPS}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isSaving ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-saving">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <span>Guardando...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="text-last-saved">
                  <CheckCircle className="w-3 h-3" />
                  <span>Guardado {new Date(lastSaved).toLocaleTimeString()}</span>
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
                <span className="hidden sm:inline">Guardar</span>
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
  );
}
