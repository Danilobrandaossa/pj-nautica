type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  // Deletar todas as chaves que começam com um prefixo
  delPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  wrap<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return Promise.resolve(cached);
    return fetcher().then((val) => {
      this.set(key, val, ttlMs);
      return val;
    });
  }
}

export const cache = new InMemoryCache();

export function cacheKey(namespace: string, parts: Array<string | number | boolean | undefined | null>): string {
  return `${namespace}:${parts.filter((p) => p !== undefined && p !== null).join(':')}`;
}


