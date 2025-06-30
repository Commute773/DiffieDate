import type { CollectionObject } from "./db.types";

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
    this.collections = JSON.parse(data) || {};
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

  getCollectionObjectOr<T extends CollectionObject>(
    collectionName: string,
    objectId: string,
    defaultObject: () => T
  ): T {
    const object = this.getCollectionObject<T>(collectionName, objectId);
    if (object) {
      return object;
    }
    const newObject = defaultObject();
    this.updateCollectionObject(collectionName, objectId, newObject);
    return newObject;
  }

  listObjectsInCollection<T extends CollectionObject>(
    collectionName: string
  ): T[] {
    if (!this.collections || !this.collections[collectionName]) {
      return [];
    }
    return shuffleArray(Object.values(this.collections[collectionName])) as T[];
  }
}
