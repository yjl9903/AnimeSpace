export class KVStore<V> {
  private readonly prefix: string;

  constructor(private readonly store: KVNamespace, prefix = '') {
    this.prefix = prefix + ':';
  }

  async get(key: string): Promise<V | null> {
    const text = await this.store.get(this.prefix + key);
    if (!!text) {
      return JSON.parse(text);
    } else {
      return null;
    }
  }

  async keys(): Promise<string[]> {
    return (await this.store.list({ prefix: this.prefix })).keys.map(
      (k) => k.name
    );
  }

  async list(): Promise<V[]> {
    const keys = await this.keys();
    const arr: V[] = [];
    for (const key of keys) {
      const value = await this.store.get(key);
      if (!!value) {
        arr.push(JSON.parse(value));
      }
    }
    return Promise.all(
      keys
        .map(async (key) => {
          const value = await this.store.get(key);
          if (!!value) {
            return JSON.parse(value);
          }
        })
        .filter(Boolean)
    );
  }

  async has(key: string): Promise<boolean> {
    return !!(await this.store.get(this.prefix + key));
  }

  async put(key: string, value: V): Promise<void> {
    await this.store.put(this.prefix + key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(this.prefix + key);
  }
}
