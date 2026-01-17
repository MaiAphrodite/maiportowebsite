"use client";

import React from 'react';

export const Terminal = () => {
    return (
        <div className="bg-[#282a36] h-full w-full text-[#f8f8f2] font-mono p-4 text-sm overflow-auto">
            <div className="mb-4">
                <span className="text-[#50fa7b]">mai@portfolio</span>
                <span className="text-[#f8f8f2]">:</span>
                <span className="text-[#8be9fd]">~</span>
                <span className="text-[#f8f8f2]">$ fetch</span>
            </div>

            <div className="flex gap-6">
                {/* ASCII Art or Character Image */}
                <div className="text-[#ff79c6] hidden sm:block select-none">
                    {`       /\\
      /  \\
     /    \\
    /      \\
   /   ok   \\
  /__________\\
  |          |
  |  (>_<)   |
  |__________|`}
                </div>

                <div className="flex flex-col gap-1">
                    <div><span className="text-[#ff79c6]">OS</span>: Portfolio OS v1.0</div>
                    <div><span className="text-[#ff79c6]">Host</span>: Web Browser</div>
                    <div><span className="text-[#ff79c6]">Kernel</span>: Next.js 15</div>
                    <div><span className="text-[#ff79c6]">Shell</span>: Zsh (Simulated)</div>
                    <div><span className="text-[#ff79c6]">Resolution</span>: Responsive</div>
                    <div><span className="text-[#ff79c6]">DE</span>: React Desktop Environment</div>
                    <div><span className="text-[#ff79c6]">WM</span>: Tiling (Manual)</div>
                    <div><span className="text-[#ff79c6]">Theme</span>: Pastel Cute</div>
                    <div className="mt-2 flex gap-1">
                        <div className="w-4 h-4 bg-[#ff5555]"></div>
                        <div className="w-4 h-4 bg-[#50fa7b]"></div>
                        <div className="w-4 h-4 bg-[#f1fa8c]"></div>
                        <div className="w-4 h-4 bg-[#bd93f9]"></div>
                        <div className="w-4 h-4 bg-[#ff79c6]"></div>
                        <div className="w-4 h-4 bg-[#8be9fd]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <span className="text-[#50fa7b]">mai@portfolio</span>
                <span className="text-[#f8f8f2]">:</span>
                <span className="text-[#8be9fd]">~</span>
                <span className="text-[#f8f8f2]">$ <span className="animate-pulse">_</span></span>
            </div>
        </div>
    );
};
