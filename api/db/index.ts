import { Client } from 'pg';
import { migrateDatabase } from './db-structure';

const connectionString = process.env.DATABASE;

let config;
if (connectionString) {
    config = {
        connectionString
    }
}

const client = new Client(config);

export const init = client.connect().then(async() => {
   await migrateDatabase(client);
}); 

export const getClient = ( async () => {
    await init;
    return client;
});