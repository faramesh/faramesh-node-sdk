"use strict";
/**
 * In-memory action snapshot store for convenience
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSnapshotStore = void 0;
exports.getDefaultStore = getDefaultStore;
class ActionSnapshotStore {
    constructor(maxSize = 1000) {
        this.actions = new Map();
        this.recent = [];
        this.maxSize = maxSize;
    }
    addAction(action) {
        const actionId = action.id;
        if (!actionId) {
            throw new Error("Action must have 'id' field");
        }
        this.actions.set(actionId, action);
        this.recent.push(actionId);
        // Trim if over max size
        if (this.recent.length > this.maxSize) {
            const removed = this.recent.shift();
            if (removed) {
                this.actions.delete(removed);
            }
        }
    }
    getAction(actionId) {
        return this.actions.get(actionId);
    }
    listRecent(limit = 50) {
        const recentIds = this.recent.slice(-limit);
        return recentIds
            .reverse()
            .map((id) => this.actions.get(id))
            .filter((action) => action !== undefined);
    }
    clear() {
        this.actions.clear();
        this.recent = [];
    }
}
exports.ActionSnapshotStore = ActionSnapshotStore;
// Optional singleton instance
let defaultStore = null;
function getDefaultStore() {
    if (!defaultStore) {
        defaultStore = new ActionSnapshotStore();
    }
    return defaultStore;
}
