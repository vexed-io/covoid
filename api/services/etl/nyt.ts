import axios from 'axios';
import { getClient } from "../../db";
import { csvParse } from "./util";

export const getNYTData = async () => {
    return await Promise.all([ axios({
        url: 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv',
        method: 'GET',
        responseType: 'arraybuffer', // important
    }).then(csvParse),
    axios({
        url: 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv',
        method: 'GET',
        responseType: 'arraybuffer', // important
    }).then(csvParse)])
}

export const loadNYTData = async() => {
    const [states, counties] =  await getNYTData();
    await loadNYTCounties(counties);
    await loadNYTStates(states);
}

const loadNYTStates = async (data) => {
    const client = await getClient();
    client.query('begin;');
    client.query('truncate nyt_state;');

    const query = `INSERT INTO 
        nyt_state(
            date, 
            cases, 
            deaths, 
            state,
            fips) 
        VALUES($1, $2, $3, $4, $5)`

    await Promise.all(data.map(async (d) => {
        await client.query(query, [
            d.date,
            parseInt(d.cases),
            parseInt(d.deaths),
            d.state,
            parseInt(d.fips)
        ]).catch((e) => {
            console.error(e);
            process.kill(0);
        })
    }));
    await client.query('commit;');  
}

const loadNYTCounties = async (data) => {
    const client = await getClient();
    client.query('begin;');
    client.query('truncate nyt_counties;');

    const query = `INSERT INTO 
        nyt_counties(
            date, 
            cases, 
            deaths, 
            county,
            state,
            fips) 
        VALUES($1, $2, $3, $4, $5, $6)`

    await Promise.all(data.map(async (d) => {
        const binds = [
            d.date,
            parseInt(d.cases),
            parseInt(d.deaths),
            d.county,
            d.state,
            parseInt(d.fips)
        ];
        await client.query(query, binds).catch((e) => {
            console.error(binds);
            console.error(e);
            process.kill(0);
        })
    }))
    await client.query('commit;');
}
