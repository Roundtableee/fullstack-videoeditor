"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import VideoToolCard from "./VideoToolCard";
import { videoTools } from "@/lib/data";

const VideoToolsSection = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="py-8 px-4 md:px-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-xl font-semibold mb-6"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 mr-2" />
        ) : (
          <ChevronRight className="h-5 w-5 mr-2" />
        )}
        Video Tools
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videoTools.map((tool) => (
            <VideoToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoToolsSection;