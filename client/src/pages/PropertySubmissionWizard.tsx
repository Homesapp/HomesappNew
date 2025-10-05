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

import Step1PropertyType from "@/components/wizard/Step1PropertyType";
import Step2BasicInfo from "@/components/wizard/Step2BasicInfo";
import Step3Location from "@/components/wizard/Step3Location";
import Step4Details from "@/components/wizard/Step4Details";
import Step5Media from "@/components/wizard/Step5Media";
import Step6Terms from "@/components/wizard/Step6Terms";
import Step7Review from "@/components/wizard/Step7Review";

const TOTAL_STEPS = 7;
const AUTO_SAVE_DELAY = 2000; // 2 seconds

type WizardData = {
  isForRent: boolean;
  isForSale: boolean;
  basicInfo?: any;
  locationInfo?: any;
  details?: any;
  media?: any;
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
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
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
      setLastSaved(new Date());
      setIsSaving(false);
    },
  });

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    const dataToSave = {
      ...wizardData,
      currentStep,
    };

    try {
      if (draftId) {
        await updateDraftMutation.mutateAsync({ id: draftId, data: dataToSave });
      } else {
        const newDraft = await createDraftMutation.mutateAsync(dataToSave);
        setDraftId(newDraft.id);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      setIsSaving(false);
    }
  }, [wizardData, currentStep, draftId, isSaving]);

  // Trigger auto-save when data changes
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      autoSave();
    }, AUTO_SAVE_DELAY);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [wizardData]);

  // Save current step when it changes
  useEffect(() => {
    if (draftId && currentStep > 1) {
      updateDraftMutation.mutate({
        id: draftId,
        data: { currentStep },
      });
    }
  }, [currentStep, draftId]);

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleManualSave = () => {
    autoSave();
    toast({
      title: "Progreso guardado",
      description: "Tu progreso ha sido guardado exitosamente",
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PropertyType
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2BasicInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <Step3Location
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <Step4Details
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <Step5Media
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <Step6Terms
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <Step7Review
            data={wizardData}
            draftId={draftId}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle data-testid="heading-wizard-title">Cargar Nueva Propiedad</CardTitle>
              <CardDescription data-testid="text-wizard-description">
                Paso {currentStep} de {TOTAL_STEPS}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4" data-testid="progress-wizard" />
        </CardHeader>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}
