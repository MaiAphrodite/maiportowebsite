"use client";

import React from 'react';
import Image from 'next/image';
import { X, Bell } from 'lucide-react';
import { Notification } from '@/features/notifications/context/NotificationContext';

interface NotificationPillProps {
    notifications: Notification[];
    onClose: (id: string) => void;
}

export const NotificationPill = ({ notifications, onClose }: NotificationPillProps) => {
    // If no notifications, don't render anything
    if (notifications.length === 0) return null;

    return (
        <div className="w-full h-10 bg-[#1e1e2e] border-t-2 border-mai-primary/30 shadow-2xl flex items-center relative group overflow-hidden">
            {/* Gradient Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#1e1e2e] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#1e1e2e] to-transparent z-10 pointer-events-none" />

            {/* Marquee Content */}
            <div className="flex items-center whitespace-nowrap min-w-full animate-marquee cursor-default hover:[animation-play-state:paused] py-1">
                {/* 
                    Render the list multiple times to ensure seamless loop.
                */}
                {[...notifications, ...notifications, ...notifications].map((notif, index) => (
                    <div
                        key={`${notif.id}-${index}`}
                        className="flex items-center gap-3 mr-16 group/item cursor-pointer hover:bg-white/5 px-3 py-1 rounded transition-colors"
                        onClick={() => notif.onClick?.()}
                    >
                        {/* Type Icon */}
                        <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/70 overflow-hidden">
                            {notif.image ? <Image src={notif.image} alt="" width={24} height={24} className="object-cover w-full h-full" /> :
                                notif.type === 'live' ? <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" /> : <Bell size={12} />}
                        </span>

                        <span className={`font-bold uppercase tracking-widest text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${notif.type === 'error' ? 'text-red-400 border-red-500/20' :
                                notif.type === 'success' ? 'text-green-400 border-green-500/20' :
                                    notif.type === 'warning' ? 'text-yellow-400 border-yellow-500/20' :
                                        notif.type === 'live' ? 'text-rose-500 border-rose-500/20' :
                                            'text-blue-400 border-blue-500/20'
                            }`}>
                            {notif.type === 'live' ? 'LIVE' : notif.type}
                        </span>

                        <span className="font-mono text-sm text-white/90">
                            <span className="font-bold text-mai-primary">{notif.title}</span>
                            <span className="text-white/30 mx-2">::</span>
                            <span className="text-white/70">{notif.message}</span>
                        </span>

                        {/* Dismiss button for individual item */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(notif.id); }}
                            className="ml-2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-red-400 transition-all"
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
