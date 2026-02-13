/**
 * RingBuffer: A SharedArrayBuffer-backed circular buffer for TTS audio slots.
 * Enables zero-copy data sharing between workers and the playback coordinator.
 * Uses Atomics for thread-safe synchronization.
 */

// Slot status flags
export const SLOT_EMPTY = 0;
export const SLOT_FILLING = 1;
export const SLOT_READY = 2;

// Default configuration
const DEFAULT_SLOT_COUNT = 8;
const DEFAULT_MAX_AUDIO_SIZE = 512 * 1024; // 512KB per slot (enough for ~5s of 22kHz mono WAV)

// Memory layout per slot:
// - 4 bytes: status flag (Int32)
// - 4 bytes: audio data length (Int32)
// - MAX_AUDIO_SIZE bytes: audio data (Uint8Array)
const HEADER_SIZE = 8; // status + length

export interface RingBufferConfig {
    slotCount?: number;
    maxAudioSize?: number;
}

export class RingBuffer {
    private readonly sab: SharedArrayBuffer;
    private readonly slotCount: number;
    private readonly maxAudioSize: number;
    private readonly slotSize: number;
    private readonly statusView: Int32Array;

    constructor(config: RingBufferConfig = {}) {
        this.slotCount = config.slotCount ?? DEFAULT_SLOT_COUNT;
        this.maxAudioSize = config.maxAudioSize ?? DEFAULT_MAX_AUDIO_SIZE;
        this.slotSize = HEADER_SIZE + this.maxAudioSize;

        // Allocate SharedArrayBuffer for all slots
        const totalSize = this.slotCount * this.slotSize;
        this.sab = new SharedArrayBuffer(totalSize);

        // Int32 view for status flags (one per slot, at the start of each slot)
        // We create a view of the entire buffer and address by index
        this.statusView = new Int32Array(this.sab);

        // Initialize all slots to empty
        for (let i = 0; i < this.slotCount; i++) {
            this.setStatus(i, SLOT_EMPTY);
            this.setAudioLength(i, 0);
        }
    }

    /** Get the underlying SharedArrayBuffer (for passing to workers) */
    getBuffer(): SharedArrayBuffer {
        return this.sab;
    }

    /** Get buffer configuration */
    getConfig(): { slotCount: number; maxAudioSize: number; slotSize: number } {
        return {
            slotCount: this.slotCount,
            maxAudioSize: this.maxAudioSize,
            slotSize: this.slotSize,
        };
    }

    /** Calculate byte offset for a slot's status field */
    private statusOffset(slotIndex: number): number {
        return (slotIndex * this.slotSize) / 4; // Int32 index
    }

    /** Calculate byte offset for a slot's audio length field */
    private lengthOffset(slotIndex: number): number {
        return (slotIndex * this.slotSize + 4) / 4; // Int32 index, after status
    }

    /** Calculate byte offset for a slot's audio data */
    private dataOffset(slotIndex: number): number {
        return slotIndex * this.slotSize + HEADER_SIZE;
    }

    /** Get status of a slot (thread-safe read) */
    getStatus(slotIndex: number): number {
        return Atomics.load(this.statusView, this.statusOffset(slotIndex));
    }

    /** Set status of a slot (thread-safe write) */
    setStatus(slotIndex: number, status: number): void {
        Atomics.store(this.statusView, this.statusOffset(slotIndex), status);
    }

    /** Get audio data length for a slot */
    private getAudioLength(slotIndex: number): number {
        return Atomics.load(this.statusView, this.lengthOffset(slotIndex));
    }

    /** Set audio data length for a slot */
    private setAudioLength(slotIndex: number, length: number): void {
        Atomics.store(this.statusView, this.lengthOffset(slotIndex), length);
    }

    /**
     * Reserve a slot for writing (mark as FILLING).
     * Returns the slot index to use.
     */
    allocateSlot(id: number): number {
        const slotIndex = id % this.slotCount;

        // Wait if slot is not empty (previous audio not yet consumed)
        // This prevents overwriting unplayed audio
        while (this.getStatus(slotIndex) !== SLOT_EMPTY) {
            // Busy wait with a small delay to avoid CPU spinning
            // In production, we could use Atomics.wait here if we track "consumed" separately
            Atomics.wait(this.statusView, this.statusOffset(slotIndex), this.getStatus(slotIndex), 100);
        }

        this.setStatus(slotIndex, SLOT_FILLING);
        return slotIndex;
    }

    /**
     * Write audio data to a slot and mark as READY.
     * Called by workers after synthesis.
     */
    writeToSlot(slotIndex: number, audioData: Uint8Array): void {
        if (audioData.length > this.maxAudioSize) {
            console.warn(`[RingBuffer] Audio data too large: ${audioData.length} > ${this.maxAudioSize}`);
            // Truncate to fit
        }

        const dataView = new Uint8Array(this.sab, this.dataOffset(slotIndex), this.maxAudioSize);
        const writeLength = Math.min(audioData.length, this.maxAudioSize);

        // Copy audio data
        dataView.set(audioData.subarray(0, writeLength));

        // Set length
        this.setAudioLength(slotIndex, writeLength);

        // Mark as ready and notify waiters
        Atomics.store(this.statusView, this.statusOffset(slotIndex), SLOT_READY);
        Atomics.notify(this.statusView, this.statusOffset(slotIndex), 1);
    }

    /**
     * Wait for a slot to become READY.
     * Blocks until the slot is ready (used by playback coordinator).
     * Returns 'ok' when ready, 'timed-out' if timeout exceeded.
     */
    waitForSlot(slotIndex: number, timeoutMs: number = Infinity): 'ok' | 'timed-out' {
        const statusIdx = this.statusOffset(slotIndex);

        // Fast path: already ready
        if (Atomics.load(this.statusView, statusIdx) === SLOT_READY) {
            return 'ok';
        }

        // Block until status changes to READY
        const start = Date.now();
        while (Atomics.load(this.statusView, statusIdx) !== SLOT_READY) {
            const remaining = timeoutMs === Infinity ? Infinity : timeoutMs - (Date.now() - start);
            if (remaining <= 0) return 'timed-out';

            const result = Atomics.wait(
                this.statusView,
                statusIdx,
                Atomics.load(this.statusView, statusIdx),
                Math.min(remaining, 1000) // Check every 1s max
            );

            if (result === 'timed-out' && remaining !== Infinity && Date.now() - start >= timeoutMs) {
                return 'timed-out';
            }
        }

        return 'ok';
    }

    /**
     * Read audio data from a READY slot.
     * Returns a copy of the audio data.
     */
    readSlot(slotIndex: number): Uint8Array {
        const length = this.getAudioLength(slotIndex);
        const dataView = new Uint8Array(this.sab, this.dataOffset(slotIndex), length);

        // Return a copy (the original buffer may be reused)
        return new Uint8Array(dataView);
    }

    /**
     * Free a slot after playback (mark as EMPTY).
     * Notifies any waiting allocators.
     */
    freeSlot(slotIndex: number): void {
        this.setAudioLength(slotIndex, 0);
        Atomics.store(this.statusView, this.statusOffset(slotIndex), SLOT_EMPTY);
        Atomics.notify(this.statusView, this.statusOffset(slotIndex), 1);
    }

    /**
     * Reset all slots to EMPTY.
     */
    reset(): void {
        for (let i = 0; i < this.slotCount; i++) {
            this.setAudioLength(i, 0);
            this.setStatus(i, SLOT_EMPTY);
        }
    }
}

/**
 * Helper to create a RingBuffer view from an existing SharedArrayBuffer.
 * Used by workers that receive the SAB via postMessage.
 */
export class RingBufferView {
    private readonly sab: SharedArrayBuffer;
    private readonly statusView: Int32Array;
    private readonly slotSize: number;
    private readonly maxAudioSize: number;

    constructor(sab: SharedArrayBuffer, slotSize: number, maxAudioSize: number) {
        this.sab = sab;
        this.slotSize = slotSize;
        this.maxAudioSize = maxAudioSize;
        this.statusView = new Int32Array(sab);
    }

    private statusOffset(slotIndex: number): number {
        return (slotIndex * this.slotSize) / 4;
    }

    private lengthOffset(slotIndex: number): number {
        return (slotIndex * this.slotSize + 4) / 4;
    }

    private dataOffset(slotIndex: number): number {
        return slotIndex * this.slotSize + 8;
    }

    /** Write audio data to a slot and mark as READY */
    writeToSlot(slotIndex: number, audioData: Uint8Array): void {
        const dataView = new Uint8Array(this.sab, this.dataOffset(slotIndex), this.maxAudioSize);
        const writeLength = Math.min(audioData.length, this.maxAudioSize);

        dataView.set(audioData.subarray(0, writeLength));
        Atomics.store(this.statusView, this.lengthOffset(slotIndex), writeLength);
        Atomics.store(this.statusView, this.statusOffset(slotIndex), SLOT_READY);
        Atomics.notify(this.statusView, this.statusOffset(slotIndex), 1);
    }

    /** Mark slot as FILLING (being processed) */
    markFilling(slotIndex: number): void {
        Atomics.store(this.statusView, this.statusOffset(slotIndex), SLOT_FILLING);
    }
}
