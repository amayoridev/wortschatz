import { MongoClient, Db } from "mongodb";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
const LOCAL_DB_PATH = path.join(process.cwd(), "db.json");

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Initialize JSON database if it doesn't exist
const initLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(
      LOCAL_DB_PATH,
      JSON.stringify({ users: [], categories: [], vocabularies: [] }, null, 2),
      "utf8"
    );
  }
};

const getLocalDb = () => {
  initLocalDb();
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return { users: [], categories: [], vocabularies: [] };
  }
};

const saveLocalDb = (data: any) => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
};

// Lazy initialization of MongoDB
export async function getDatabase() {
  if (MONGODB_URI) {
    if (!mongoClient) {
      try {
        console.log("Connecting to MongoDB lazily...");
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        mongoDb = mongoClient.db();
        console.log("Successfully connected to MongoDB.");
      } catch (error) {
        console.error("Failed to connect to MongoDB, falling back to local file DB:", error);
        return { isMongo: false };
      }
    }
    return { isMongo: true, db: mongoDb! };
  }
  return { isMongo: false };
}

// Database Operations Wrapper
export async function findOne(collectionName: string, query: any): Promise<any> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    return await dbState.db.collection(collectionName).findOne(query);
  } else {
    const localData = getLocalDb();
    const items = localData[collectionName] || [];
    return items.find((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }
}

export async function findMany(collectionName: string, query: any): Promise<any[]> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    return await dbState.db.collection(collectionName).find(query).toArray();
  } else {
    const localData = getLocalDb();
    const items = localData[collectionName] || [];
    return items.filter((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }
}

export async function insertOne(collectionName: string, document: any): Promise<void> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    await dbState.db.collection(collectionName).insertOne(document);
  } else {
    const localData = getLocalDb();
    if (!localData[collectionName]) {
      localData[collectionName] = [];
    }
    localData[collectionName].push(document);
    saveLocalDb(localData);
  }
}

export async function updateOne(collectionName: string, query: any, updateData: any): Promise<void> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    await dbState.db.collection(collectionName).updateOne(query, { $set: updateData });
  } else {
    const localData = getLocalDb();
    const items = localData[collectionName] || [];
    const index = items.findIndex((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
    if (index !== -1) {
      items[index] = { ...items[index], ...updateData };
      localData[collectionName] = items;
      saveLocalDb(localData);
    }
  }
}

export async function deleteOne(collectionName: string, query: any): Promise<void> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    await dbState.db.collection(collectionName).deleteOne(query);
  } else {
    const localData = getLocalDb();
    const items = localData[collectionName] || [];
    const index = items.findIndex((item: any) => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
    if (index !== -1) {
      items.splice(index, 1);
      localData[collectionName] = items;
      saveLocalDb(localData);
    }
  }
}

export async function deleteMany(collectionName: string, query: any): Promise<void> {
  const dbState = await getDatabase();
  if (dbState.isMongo && dbState.db) {
    await dbState.db.collection(collectionName).deleteMany(query);
  } else {
    const localData = getLocalDb();
    const items = localData[collectionName] || [];
    const filteredItems = items.filter((item: any) => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });
    localData[collectionName] = filteredItems;
    saveLocalDb(localData);
  }
}
