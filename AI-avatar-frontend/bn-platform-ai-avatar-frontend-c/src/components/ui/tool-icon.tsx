"use client";

import React from "react";
import { 
  Camera, 
  Video, 
  Globe, 
  Presentation,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolType = "photo" | "video" | "translate" | "presentation";

interface ToolIconProps {
  type: ToolType;
  className?: string;
}

const ToolIcon = ({ type, className }: ToolIconProps) => {
  let Icon: LucideIcon;
  let bgColor: string;
  
  switch (type) {
    case "photo":
      Icon = Camera;
      bgColor = "bg-red-100";
      break;
    case "video":
      Icon = Video;
      bgColor = "bg-blue-100";
      break;
    case "translate":
      Icon = Globe;
      bgColor = "bg-green-100";
      break;
    case "presentation":
      Icon = Presentation;
      bgColor = "bg-amber-100";
      break;
    default:
      Icon = Video;
      bgColor = "bg-purple-100";
  }

  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center",
      bgColor,
      className
    )}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

export default ToolIcon;