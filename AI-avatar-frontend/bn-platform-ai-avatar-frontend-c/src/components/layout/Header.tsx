"use client";

import React from "react";
import { Globe, Bell } from "lucide-react";

const Header = () => {
  return (
    <header className="flex justify-end items-center h-16 px-6 border-b border-gray-100">
      <div className="flex items-center space-x-4">
        <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <Globe className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Community</span>
        </button>
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;