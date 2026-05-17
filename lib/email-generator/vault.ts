/**
 * Email Generator — Vault Store
 *
 * Replaces Firebase/Firestore with a JSON-backed in-memory store.
 * Stores "evidence" (your past work/achievements) and "inspiration"
 * (industry best practices/theories) that feed the RAG pipeline.
 */

import { promises as fs } from "fs";
import path from "path";
import type { VaultItem } from "./types";

interface VaultData {
  items: VaultItem[];
}

const VAULT_FILE = path.join(process.cwd(), "data", "vault-store.json");
let _cache: VaultData | null = null;

async function ensureDir() {
  await fs.mkdir(path.dirname(VAULT_FILE), { recursive: true });
}

function createEmpty(): VaultData {
  return { items: [] };
}

class VaultStore {
  load(): VaultData {
    if (_cache) return _cache;
    try {
      const raw = require("fs").readFileSync(VAULT_FILE, "utf-8");
      _cache = JSON.parse(raw) as VaultData;
    } catch {
      _cache = createEmpty();
    }
    return _cache;
  }

  async save(): Promise<void> {
    if (!_cache) return;
    try {
      await ensureDir();
      await fs.writeFile(VAULT_FILE, JSON.stringify(_cache, null, 2));
    } catch {
      // Silently fail on read-only filesystems (Vercel prod)
    }
  }

  getAll(): VaultItem[] {
    return this.load().items;
  }

  getByType(vaultType: "evidence" | "inspiration"): VaultItem[] {
    return this.load()
      .items.filter((i) => i.vaultType === vaultType)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTopByRecency(
    vaultType: "evidence" | "inspiration",
    limit: number = 3
  ): VaultItem[] {
    return this.getByType(vaultType).slice(0, limit);
  }

  add(item: Omit<VaultItem, "id" | "timestamp">): VaultItem {
    const data = this.load();
    const newItem: VaultItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    data.items.push(newItem);
    void this.save();
    return newItem;
  }

  remove(id: string): boolean {
    const data = this.load();
    const before = data.items.length;
    data.items = data.items.filter((i) => i.id !== id);
    if (data.items.length < before) {
      void this.save();
      return true;
    }
    return false;
  }
}

export const vaultStore = new VaultStore();
