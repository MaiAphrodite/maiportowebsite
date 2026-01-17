"use client";

import React from 'react';
import { Menu } from 'lucide-react';

export const StartButton = () => {
    return (
        <button className="p-2.5 bg-mai-primary rounded-2xl text-white hover:opacity-80 transition-all shadow-sm active:scale-95">
            <Menu size={24} />
        </button>
    );
};
