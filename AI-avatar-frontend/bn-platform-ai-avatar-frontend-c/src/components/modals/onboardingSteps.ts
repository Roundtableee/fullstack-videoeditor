// onboardingSteps.ts
import type { ReactNode } from "react";

export interface OnboardingStep {
  title: string;
  description: string;
  image?: string; // Path to image asset (optional)
  // You can add more fields, e.g., content: ReactNode, for richer content
}

export const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to the Video Editor!",
    description: "This quick tutorial will help you get started with the main features.",
    image: "/images/onboarding/cat.jpg", // Example image path
  },
  {
    title: "Canvas & Timeline",
    description: "Use the canvas to preview your video and the timeline to arrange clips, images, and audio.",
    image: "/images/onboarding/canvas.png",
  },
  {
    title: "Editing Tools",
    description: "Access editing tools to trim, crop, and add effects. Right-click on elements for more options.",
    image: "/images/onboarding/tools.png",
  },
  {
    title: "Export & Share",
    description: "When you're done, export your video and share it directly from the app.",
    image: "/images/onboarding/export.png",
  },
];
