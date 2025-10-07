import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import type { PropertySubmissionDraft } from "@shared/schema";

import Step1BasicInfo from "@/components/wizard/Step1BasicInfo";
import Step2LocationDetails from "@/components/wizard/Step2LocationDetails";
import Step3Media from "@/components/wizard/Step5Media";
import Step4Services from "@/components/wizard/Step4Services";
import Step5AccessInfo from "@/components/wizard/Step5AccessInfo";
import Step6TermsReview from "@/components/wizard/Step5TermsReview";

const TOTAL_STEPS = 6;

type WizardData = {
  isForRent: boolean;
  isForSale: boolean;
  basicInfo?: any;
  locationInfo?: any;
  details?: any;
  media?: any;
  servicesInfo?: any;
  accessInfo?: any;
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
          commercialTerms: draft.commercialTerms,
        });
      }
    }
  }, [existingDrafts]);

  // Create draft mutation
  const createDraftMutation = useMutation<PropertySubmissionDraft, Error, Partial<WizardData> & { currentStep: number }>({
    mutationFn: async (data: Partial<WizardData> & { currentStep: number }) => {
      const response = await apiRequest("POST", "/api/property-submission-drafts", data);
      return response as unknown as PropertySubmissionDraft;
    },
    onSuccess: (data: PropertySubmissionDraft) => {
      setDraftId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/property-submission-drafts"] });
    },
  });

  // Update draft mutation
  const updateDraftMutation = useMutation<PropertySubmissionDraft, Error, { id: string; data: Partial<WizardData> & { currentStep?: number } }>({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WizardData> & { currentStep?: number } }) => {
      const response = await apiRequest("PATCH", `/api/property-submission-drafts/${id}`, data);
      return response as unknown as PropertySubmissionDraft;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-submission-drafts"] });
    },
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
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [wizardData, currentStep, draftId, isSaving, draftId, updateDraftMutation, createDraftMutation]);

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
      } catch (error) {
        console.error("Save failed:", error);
      } finally {
        setIsSaving(false);
      }
      
      setCurrentStep(nextStep);
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
          <Step6TermsReview
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
              {lastSaved && (
                <span className="text-sm text-muted-foreground" data-testid="text-last-saved">
                  Guardado {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              {isSaving && (
                <span className="text-sm text-muted-foreground" data-testid="text-saving">
                  Guardando...
                </span>
              )}
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
