import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { VideoTool } from "@/lib/types";

interface VideoToolCardProps {
  tool: VideoTool;
}

const VideoToolCard: React.FC<VideoToolCardProps> = ({ tool }) => {
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="relative h-44 w-full">
        <Image
          src={tool.imageSrc}
          alt={tool.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-2">
          <h3 className="text-lg font-medium">{tool.title}</h3>
          {tool.tag && (
            <span
              className={cn(
                "ml-2 px-2 py-0.5 text-xs font-medium rounded",
                {
                  "bg-gray-200 text-gray-800": tool.tag.type === "new",
                  "bg-black text-white": tool.tag.type === "popular",
                  "bg-gray-100 text-gray-800": tool.tag.type === "default",
                }
              )}
            >
              {tool.tag.text}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{tool.description}</p>
      </div>
    </div>
  );
};

export default VideoToolCard;