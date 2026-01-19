// Desktop feature exports
export { Desktop } from './components/Desktop';
export { DesktopIcons } from './components/DesktopIcons';
export { Taskbar } from './components/Taskbar';
export { Window } from './components/Window';
export { BootSplash } from './components/BootSplash';
export { MobileHome } from './components/mobile/MobileHome'; // Accessing internal component directly for now or should I export it?
// Actually, let's export MobileHome from components/mobile if needed


// Context exports
export {
    DesktopProvider,
    useDesktop,
    useDesktopState,
    useDesktopActions,
} from './context/DesktopContext';
export type { WindowContent } from './context/DesktopContext';
