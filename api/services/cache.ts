import { createClient } from 'redis';
import { promisify } from 'util';

const client = createClient({
    url: process.env.REDIS_URL
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const flushAllAsync = promisify(client.flushall).bind(client);

export const get = async (key) => {
    return await getAsync(key)
};

export const set = async (key, value) => {
    setAsync(key, JSON.stringify(value))
};

export const reset = async () => {
    await flushAllAsync();
};