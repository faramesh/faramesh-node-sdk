/**
 * In-memory action snapshot store for convenience
 */
import { Action } from "./types";
export declare class ActionSnapshotStore {
    private actions;
    private recent;
    private maxSize;
    constructor(maxSize?: number);
    addAction(action: Action): void;
    getAction(actionId: string): Action | undefined;
    listRecent(limit?: number): Action[];
    clear(): void;
}
export declare function getDefaultStore(): ActionSnapshotStore;
