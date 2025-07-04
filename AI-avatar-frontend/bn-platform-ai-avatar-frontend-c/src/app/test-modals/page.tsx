"use client";
import * as React from "react";
import { OnboardingModal, ConfirmationModal, ExportCompleteNotification, UnsavedChangesWarningModal } from "@/components/modals";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useExportStatus } from "@/hooks/useExportStatus";
import { useToast } from "@/hooks/use-toast";

export default function TestModalsPage() {
  // Onboarding
  const { open: isOnboardingOpen, close: handleOnboardingClose } = useOnboarding();

  // Add a function to reset onboarding for testing
  const resetOnboarding = () => {
    window.localStorage.removeItem('has_seen_onboarding');
    window.location.reload();
  };

  // Confirmation
  const {
    open: confirmationOpen,
    settings: confirmationSettings,
    onConfirm: confirmationOnConfirm,
    onCancel: confirmationOnCancel,
    show: showConfirmation,
    hide: hideConfirmation,
  } = useConfirmationModal();

  // Export Complete
  const [exportOpen, setExportOpen] = React.useState(false);
  useExportStatus({
    url: "/api/mock-export-status",
    onComplete: () => setExportOpen(true),
  });

  // Unsaved Changes
  const [unsavedOpen, setUnsavedOpen] = React.useState(false);

  // Demo settings for confirmation modal
  const demoSettings = {
    avatarStyle: "Cartoon",
    voice: "AI Voice 1",
    background: "Studio",
    credits: 10,
  };

  const { toast } = useToast();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Test Modals Page</h1>
      <div className="space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={resetOnboarding}
        >
          Reset Onboarding (for testing)
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={() =>
            showConfirmation(
              demoSettings,
              () => {
                toast({
                  title: "Avatar generated!",
                  description: "Your avatar has been successfully created.",
                });
                hideConfirmation();
              },
              () => {
                toast({
                  title: "Avatar generation cancelled",
                  description: "You cancelled the avatar generation.",
                  variant: "destructive",
                });
                hideConfirmation();
              }
            )
          }
        >
          Show Confirmation Modal
        </button>
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded"
          onClick={() => setExportOpen(true)}
        >
          Show Export Complete Notification
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-black rounded"
          onClick={() => setUnsavedOpen(true)}
        >
          Show Unsaved Changes Warning
        </button>
      </div>

      {/* Modals */}
      <OnboardingModal open={isOnboardingOpen} onClose={handleOnboardingClose} />
      <ConfirmationModal
        open={confirmationOpen}
        settings={confirmationSettings}
        onConfirm={confirmationOnConfirm}
        onCancel={confirmationOnCancel}
      />
      <ExportCompleteNotification
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onDownload={() =>
          toast({
            title: "Download started",
            description: "Your video is being downloaded.",
          })
        }
        onShare={() =>
          toast({
            title: "Share link copied!",
            description: "A shareable link has been copied to your clipboard.",
          })
        }
      />
      <UnsavedChangesWarningModal
        open={unsavedOpen}
        onConfirm={() => {
          toast({
            title: "Left page",
            description: "You have left the page. Unsaved changes may be lost.",
            variant: "default",
          });
          setUnsavedOpen(false);
        }}
        onCancel={() => setUnsavedOpen(false)}
      />
    </div>
  );
}
