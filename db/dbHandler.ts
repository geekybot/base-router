import { MongoDBConnection } from './index';
import dotenv from 'dotenv';
dotenv.config();
const connectionUri = process.env.MONGO_URI;
if (!connectionUri) {
    throw new Error('MONGO_URI environment variable is not defined');
}
const databaseName = "BasePairs";
const tradeCollection = "Trades";


async function addNewTrade(token: string, type: string, quantity: string, inEth: string, active: boolean, tokenDecimals: number, v2Pool: string) {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        // Create a new document with the provided inputs
        const document = {
            token,
            type,
            quantity,
            inEth,
            timeStamp: Math.floor(Date.now() / 1000), // Current timestamp in epoch
            active,
            tokenDecimals,
            v2Pool
        };

        // Write the document to the "Trades" collection
        await db.collection(tradeCollection).insertOne(document);
        // Close the connection
        await connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

async function getActiveTrades(plustime: number) {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        // Calculate the current timestamp + 60 seconds
        const currentTime = Math.floor(Date.now() / 1000);
        const futureTime = currentTime - plustime;

        // Retrieve the active trades with a timestamp greater than the future time
        const activeTrades = await db.collection(tradeCollection).find({ active: true, timeStamp: { $lt: futureTime } }).toArray();

        // Close the connection
        await connection.close();

        return activeTrades;
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

async function updateTradeCollectionActiveStatus(token: string, type: string, active: boolean) {
    try {
        // Connect to the database
        const connection = new MongoDBConnection(connectionUri ?? '');
        await connection.connect();
        const db = connection.getDatabase(databaseName);

        await db.collection(tradeCollection).updateOne({ token, type, active: true}, { $set: { active: active } });
        
        // Close the connection
        await connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

export {
    addNewTrade,
    getActiveTrades,
    updateTradeCollectionActiveStatus
};
