/**
 * Shared bridge between WavesBackground (field producer)
 * and TopoFloodTransition (field consumer).
 */

export interface TopoFieldSnapshot {
    field: Float32Array;
    cols: number;
    rows: number;
    cellSize: number;
    width: number;
    height: number;
    minVal: number;
    maxVal: number;
}

/** WavesBackground writes its current contour field here every frame */
export const topoFieldRef: { current: TopoFieldSnapshot | null } = { current: null };

/** TopoFloodTransition registers its trigger function here on mount */
export const topoTransitionRef: {
    current: ((newTheme: 'light' | 'dark', onComplete: () => void, origin?: { x: number, y: number }) => void) | null;
} = { current: null };
