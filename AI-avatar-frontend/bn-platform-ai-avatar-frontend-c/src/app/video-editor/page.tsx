'use client';

import React, { useEffect, useRef } from 'react';
import OnboardingModal from '@/components/modals/OnboardingModal';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function VideoEditorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL!;
  const { open, close } = useOnboarding();

  // Handle initial message to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const onLoad = () => {
      // Send initial data to iframe if needed
      iframe.contentWindow?.postMessage(
        { type: 'INIT', payload: { theme: 'dark' } },
        editorUrl
      );
    };
    
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [editorUrl]);

  // Handle messages from iframe
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== editorUrl) return;
      const { type, payload } = event.data;
      console.log('Received from editor:', type, payload);
    };
    
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [editorUrl]);

  return (
    <div className="w-full h-screen bg-gray-100">
      <iframe
        ref={iframeRef}
        src={editorUrl}
        title="Video Editor"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
      <OnboardingModal open={open} onClose={close} />
    </div>
  );
}
