import { Pool, PoolConfig } from 'pg';
import { migrateDatabase } from './db-structure';
const connectionString = process.env.DATABASE;

let config:PoolConfig = {
    min: 1, 
    max: 2,
    idleTimeoutMillis: 100000,
    connectionTimeoutMillis: 100000
};
if (connectionString) {
    config.connectionString = connectionString;
}

const pool = new Pool(config);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
});

export const init = pool.connect().then(async (client) => {
   await migrateDatabase(client);
   await client.release();
}); 

export const getClient = ( async () => {
    await init;
    return await pool.connect();
});