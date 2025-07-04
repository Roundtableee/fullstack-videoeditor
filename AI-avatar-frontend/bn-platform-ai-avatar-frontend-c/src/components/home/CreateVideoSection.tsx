"use client";

import React, { useState } from "react";
import { Play, Link2 } from "lucide-react";

const CreateVideoSection = () => {
  const [topic, setTopic] = useState("");

  return (
    <div className="bg-gray-50 rounded-lg p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <label className="text-base font-medium">Create a video about</label>
        <div className="flex flex-1 w-full">
          <input
            type="text"
            placeholder="your favorite topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
          />
          <button className="px-4 py-2 bg-black text-white rounded-r-lg hover:bg-gray-800 transition-colors">
            Generate
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center mt-8 gap-2">
        <button className="flex items-center text-gray-700 hover:text-black transition-colors">
          <Play className="h-4 w-4 mr-2" />
          <span>Try an example</span>
        </button>
        <span className="text-gray-400">or</span>
        <button className="flex items-center text-gray-700 hover:text-black transition-colors">
          <Link2 className="h-4 w-4 mr-2" />
          <span>Use URL instead</span>
        </button>
      </div>
    </div>
  );
};

export default CreateVideoSection;