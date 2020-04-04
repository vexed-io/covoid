import { getClient } from "../db";
import { promises } from 'fs';

async function readModuleFile(path) {
    var filename = require.resolve(path);
    return promises.readFile(filename, 'utf8');
}


export const migrateDatabase = async () => {
    const client = await getClient();
    let query = await readModuleFile('./migrations.sql');
    console.log(query);
    return await client.query(query); 
}