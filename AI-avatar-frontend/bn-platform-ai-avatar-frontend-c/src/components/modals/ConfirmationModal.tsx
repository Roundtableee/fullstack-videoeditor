import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  settings: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ open, settings, onConfirm, onCancel }: ConfirmationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
            <CheckCircle2 className="text-blue-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold">Confirm Avatar Generation</DialogTitle>
        </DialogHeader>
        <div className="py-2 px-2 bg-muted rounded-md border text-sm mb-4">
          <div className="mb-2 text-muted-foreground font-medium">You are about to generate an avatar with these settings:</div>
          <ul className="space-y-1">
            {Object.entries(settings).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="capitalize text-foreground/80">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-semibold text-foreground">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="min-w-[90px]">Cancel</Button>
          <Button onClick={onConfirm} className="min-w-[90px]" autoFocus>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
