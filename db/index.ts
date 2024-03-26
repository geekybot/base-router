// import  dotenv  from 'dotenv';
// // Create a MongoClient instance
// import { MongoClient, MongoClientOptions } from 'mongodb';
// dotenv.config();
// const connectionUri = process.env.MONGO_URI;
// if (!connectionUri) {
//     throw new Error('MONGO_URI environment variable is not defined');
// }
import { MongoClient, MongoClientOptions, Db } from 'mongodb';

export class MongoDBConnection {
    private client: MongoClient | null;
    private readonly uri: string;
    private readonly options: MongoClientOptions;

    constructor(uri: string, options: MongoClientOptions = {}) {
        this.client = null;
        this.uri = uri;
        this.options = options;
    }

    async connect(): Promise<void> {
        try {
            this.client = await MongoClient.connect(this.uri, this.options);
            // console.log("Connected successfully to MongoDB");
        } catch (error) {
            // console.error("Error connecting to MongoDB:", error);
            throw error;
        }
    }

    async close(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
                // console.log("Connection to MongoDB closed");
            } else {
                console.log("No connection to close");
            }
        } catch (error) {
            console.error("Error closing MongoDB connection:", error);
            throw error;
        }
    }

    getDatabase(dbName: string): Db {
        if (!this.client) {
            throw new Error("No connection to MongoDB");
        }
        return this.client.db(dbName);
    }
}