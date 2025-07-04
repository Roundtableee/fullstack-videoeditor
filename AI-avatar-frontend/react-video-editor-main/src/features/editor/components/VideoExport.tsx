import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Video } from "lucide-react";
import { useVideoExport } from "../hooks/useVideoExport";

export const VideoExportButton: React.FC = () => {
  const { 
    exportVideo, 
    canExport, 
    exporting,
    openProgressModal
  } = useVideoExport();

  const handleExport = async () => {
    if (!canExport || exporting) return;
    
    try {
      openProgressModal();
      await exportVideo();
    } catch (error) {
      console.error("Export failed:", error);
      // You might want to show a toast notification here
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={!canExport || exporting}
      className="flex items-center gap-2"
      variant="default"
    >
      <Video size={16} />
      {exporting ? "Exporting..." : "Export Video"}
    </Button>
  );
};

export const VideoExportProgress: React.FC = () => {
  const {
    displayProgressModal,
    progress,
    exporting,
    isCompleted,
    output,
    closeProgressModal,
    downloadVideo
  } = useVideoExport();

  return (
    <Dialog open={displayProgressModal} onOpenChange={closeProgressModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video size={20} />
            Video Export
          </DialogTitle>
          <DialogDescription>
            {exporting && "Your video is being processed..."}
            {isCompleted && "Your video is ready for download!"}
            {!exporting && !isCompleted && "Preparing to export video..."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {isCompleted && output?.url && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={downloadVideo}
                className="flex items-center gap-2 w-full"
              >
                <Download size={16} />
                Download Video
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Video URL: {output.url}
              </div>
            </div>
          )}

          {exporting && (
            <div className="text-sm text-muted-foreground text-center">
              This may take a few minutes depending on your video complexity...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
