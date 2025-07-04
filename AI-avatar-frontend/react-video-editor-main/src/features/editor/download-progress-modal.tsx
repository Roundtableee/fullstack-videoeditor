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
            <div className="text-6xl font-bold text-blue-600">
              {Math.floor(progress)}%
            </div>
            <div className="text-xl font-semibold">Rendering your video...</div>
            <div className="text-center text-gray-600 max-w-md">
              <div>Please wait while we process your video.</div>
              <div>This may take a few minutes depending on the complexity.</div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => actions.setDisplayProgressModal(false)}
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
