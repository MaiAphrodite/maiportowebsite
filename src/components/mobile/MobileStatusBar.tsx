import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const MobileStatusBar = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 h-8 px-4 flex justify-between items-center text-mai-text z-[9999] bg-transparent">
            <span className="text-xs font-bold font-mono">{time}</span>

            <div className="flex gap-2 items-center text-mai-text/80">
                <Signal size={12} />
                <Wifi size={12} />
                <BatteryMedium size={14} />
            </div>
        </div>
    );
};
