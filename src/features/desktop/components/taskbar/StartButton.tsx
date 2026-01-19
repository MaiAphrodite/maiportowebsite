"use client";

import { Button } from '@/shared/components/ui/Button';
import { Menu } from 'lucide-react';

export const StartButton = () => {
    return (
        <Button variant="default" size="icon" className="rounded-2xl shadow-sm">
            <Menu size={24} />
        </Button>
    );
};
