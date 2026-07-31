import type { LaterStartItem } from "./domain";
import { storageKeys, type StorageEngine } from "./storage-engine";

/** A deliberately tiny holding area for things the user wants to start later. */
export class LaterStartEngine {
  constructor(private readonly storage: StorageEngine) {}

  list() { return this.storage.get<LaterStartItem[]>(storageKeys.laterStarts, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }

  add(title: string) {
    const item: LaterStartItem = { id: crypto.randomUUID(), title: title.trim(), createdAt: new Date().toISOString() };
    this.storage.set(storageKeys.laterStarts, [item, ...this.list()]);
    return item;
  }

  remove(id: string) { this.storage.set(storageKeys.laterStarts, this.list().filter((item) => item.id !== id)); }
}
