import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
interface UnsavedChangesWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
const UnsavedChangesWarningModal = ({ open, onConfirm, onCancel }: UnsavedChangesWarningModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Leave Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default UnsavedChangesWarningModal;
