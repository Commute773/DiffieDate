export type CollectionObject = {
  id: string;
};

// Generic minimal DB used for both server and client (backed by fs or localStorage)
export class DB {
  collections: Record<string, Record<string, CollectionObject>> | undefined;
  private saveFunction: (data: string) => void;
  private loadFunction: () => string;

  constructor(
    saveFunction: (data: string) => void,
    loadFunction: () => string
  ) {
    this.saveFunction = saveFunction;
    this.loadFunction = loadFunction;
    this.load();
  }

  save() {
    const data = JSON.stringify(this.collections, null, 2);
    this.saveFunction(data);
  }

  load() {
    const data = this.loadFunction();
    this.collections = JSON.parse(data).collections || {};
  }

  updateCollectionObject<T extends CollectionObject>(
    collectionName: string,
    objectId: string,
    newObject: T
  ) {
    if (!this.collections) {
      this.collections = {};
    }
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = {};
    }
    this.collections[collectionName][objectId] = newObject;
    this.save();
  }

  getCollectionObject<T extends CollectionObject>(
    collectionName: string,
    objectId: string
  ): T | undefined {
    if (!this.collections || !this.collections[collectionName]) {
      return undefined;
    }
    return this.collections[collectionName][objectId] as T | undefined;
  }
}
