import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
interface ExportCompleteNotificationProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}
const ExportCompleteNotification = ({ open, onClose, onDownload, onShare }: ExportCompleteNotificationProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Complete</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          Your video export is complete!
        </div>
        <DialogFooter>
          <Button onClick={onDownload}>Download</Button>
          <Button onClick={onShare}>Share</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default ExportCompleteNotification;
