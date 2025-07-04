import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleCheckIcon, XIcon, Download, Play } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { download } from "@/utils/download";

interface VideoCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  onDownload?: () => void;
  onPreview?: () => void;
}

const VideoCompletionModal = ({ 
  isOpen, 
  onClose, 
  videoUrl,
  onDownload,
  onPreview 
}: VideoCompletionModalProps) => {
  const handleDownload = async () => {
    if (videoUrl) {
      await download(videoUrl, `rendered-video-${Date.now()}.mp4`);
      console.log("🎬 Downloading rendered video:", videoUrl);
      
      // Show toast notification
      import('sonner').then(({ toast }) => {
        toast.success('Download started!', {
          description: 'Your video is being downloaded.'
        });
      });
    }
    if (onDownload) {
      onDownload();
    }
  };

  const handlePreview = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
      console.log("🎥 Opening video preview:", videoUrl);
      
      // Show toast notification
      import('sonner').then(({ toast }) => {
        toast.info('Opening preview...', {
          description: 'Your video is opening in a new tab.'
        });
      });
    }
    if (onPreview) {
      onPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[500px] flex-col gap-0 bg-background p-0 sm:max-w-[600px]">
        <DialogTitle className="hidden" />
        <DialogDescription className="hidden" />
        
        {/* Close button */}
        <XIcon
          onClick={onClose}
          className="absolute right-4 top-5 h-5 w-5 text-zinc-400 hover:cursor-pointer hover:text-zinc-500 z-10"
        />
        
        {/* Header */}
        <div className="flex h-16 items-center border-b px-6 font-medium text-lg">
          🎬 Video Render Complete
        </div>
        
        {/* Content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
          {/* Success icon */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CircleCheckIcon className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                Render Successful! 🎉
              </div>
              <div className="text-gray-600 max-w-md">
                Your video has been rendered successfully and is ready for download or preview.
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 w-full max-w-md">
            <Button 
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!videoUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button 
              onClick={handlePreview}
              variant="outline"
              className="flex-1"
              disabled={!videoUrl}
            >
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
          
          {/* Video URL info (for debugging) */}
          {videoUrl && (
            <div className="text-xs text-gray-500 mt-4 max-w-md break-all">
              <strong>URL:</strong> {videoUrl}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCompletionModal;
