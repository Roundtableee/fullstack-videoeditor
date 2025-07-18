import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDownloadState } from "./store/use-download-state-new";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import VideoCompletionModal from "./components/VideoCompletionModal";

const DownloadProgressModal = () => {
  const { 
    progress, 
    displayProgressModal, 
    showCompletionModal,
    output, 
    exporting,
    actions 
  } = useDownloadState();

  return (
    <>
      {/* Progress Modal */}
      <Dialog
        open={displayProgressModal && exporting}
        onOpenChange={actions.setDisplayProgressModal}
      >
        <DialogContent className="flex h-[500px] flex-col gap-0 bg-background p-0 sm:max-w-[600px]">
          <DialogTitle className="hidden" />
          <DialogDescription className="hidden" />
          <XIcon
            onClick={() => actions.setDisplayProgressModal(false)}
            className="absolute right-4 top-5 h-5 w-5 text-zinc-400 hover:cursor-pointer hover:text-zinc-500"
          />
          <div className="flex h-16 items-center border-b px-6 font-medium text-lg">
            🎬 Rendering Video
          </div>
          
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            {/* Large Progress Percentage */}
            <div className="text-7xl font-bold text-blue-600 tracking-tight">
              {Math.floor(progress)}%
            </div>
            
            {/* Status Text */}
            <div className="text-xl font-semibold text-center">
              {progress === 0 && "Preparing video render..."}
              {progress > 0 && progress < 5 && "Starting FFmpeg process..."}
              {progress >= 5 && progress < 95 && "Rendering your video..."}
              {progress >= 95 && progress < 100 && "Finalizing video..."}
              {progress === 100 && "Video ready!"}
            </div>
            
            {/* Description */}
            <div className="text-center text-gray-600 max-w-md">
              <div>Please wait while we process your video.</div>
              <div className="text-sm">
                {progress === 0 && "Setting up render pipeline..."}
                {progress > 0 && progress < 5 && "Initializing video encoding..."}
                {progress >= 5 && progress < 95 && "This may take a few minutes depending on the complexity."}
                {progress >= 95 && "Almost done! Adding finishing touches..."}
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="w-full max-w-md">
              <div className="bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${Math.max(progress, 1)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span className="font-medium">{Math.floor(progress)}% Complete</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Estimated Time (จะเพิ่มในอนาคต) */}
            {progress > 5 && progress < 95 && (
              <div className="text-sm text-gray-500">
                🕒 Processing video frames...
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => actions.setDisplayProgressModal(false)}
              className="mt-4"
            >
              Hide Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Modal */}
      <VideoCompletionModal
        isOpen={showCompletionModal}
        onClose={() => actions.setShowCompletionModal(false)}
        videoUrl={output?.url}
        onDownload={() => {
          console.log('🎬 Video download initiated');
        }}
        onPreview={() => {
          console.log('🎥 Video preview opened');
        }}
      />
    </>
  );
};

export default DownloadProgressModal;
