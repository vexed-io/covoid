import { Client } from 'pg';

const connectionString = process.env.DATABASE;

let config;
if (connectionString) {
    config = {
        connectionString
    }
}

const client = new Client(config);

const init = client.connect().then(() => {
    // client.query(`
    // // begin;
    // //     create table if not exists covid_county ( date date, county text, state text, fips numeric, cases integer, deaths integer);
    // //     create table if not exists covid_state ( date date, state text, fips numeric, cases integer, deaths integer);
    // //     truncate covid_county;
    // //     truncate covid_state;
    // //     copy covid_state from program 'curl https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv' delimiter ',' csv header;
    // //     copy covid_county from program 'curl https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv' delimiter ',' csv header;
    // // commit;
    // `)
}); 

export const getClient = ( async () => {
    await init;
    return client;
});