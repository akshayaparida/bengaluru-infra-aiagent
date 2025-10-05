import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-900/50 backdrop-blur-sm border-t border-neutral-800 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {/* Hackathon Info */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-300">
              Built for FutureStack GenAI Hackathon by WeMakeDevs
            </p>
            <p className="text-xs text-neutral-400 max-w-2xl">
              Bringing together builders worldwide to push the limits of AI and cloud-native tech
            </p>
          </div>
          
          {/* Powered by Tech */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
            <span>Powered by</span>
            <span className="font-semibold text-neutral-300">Cerebras LLaMA</span>
            <span className="text-neutral-700">•</span>
            <span className="font-semibold text-neutral-300">Docker MCP Gateway</span>
          </div>
          
          {/* Copyright */}
          <p className="text-xs text-neutral-500">
            {currentYear} Bengaluru Infra AI. Built with cutting-edge AI and cloud technologies.
          </p>
        </div>
      </div>
    </footer>
  );
}
