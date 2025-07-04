"use client";

import React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayButtonProps {
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PlayButton = ({
  onClick,
  size = "md",
  className,
}: PlayButtonProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      <Play
        className={cn("text-[#7E6BF6]", {
          "h-3 w-3": size === "sm",
          "h-4 w-4": size === "md",
          "h-5 w-5": size === "lg",
        })}
        fill="#7E6BF6"
      />
    </button>
  );
};

export default PlayButton;