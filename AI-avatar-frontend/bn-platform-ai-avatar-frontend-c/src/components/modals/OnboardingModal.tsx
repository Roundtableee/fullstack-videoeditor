import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { onboardingSteps } from "./onboardingSteps";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ open, onClose }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
        </DialogHeader>
        <div className="py-2 min-h-[60px] flex flex-col items-center">
          {step.image && (
            <img
              src={step.image}
              alt={step.title}
              className="mb-4 w-full max-w-xs rounded shadow"
              style={{ objectFit: "contain" }}
            />
          )}
          <p>{step.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-1">
            {onboardingSteps.map((_, idx) => (
              <span
                key={idx}
                className={`inline-block w-2 h-2 rounded-full ${
                  idx === currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <DialogFooter className="flex flex-row gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {!isLastStep ? (
              <Button onClick={() => setCurrentStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={onClose}>Finish</Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
