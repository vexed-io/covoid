import * as xlsx from 'xlsx';
import axios from 'axios';
import * as CSV from 'csv'; 
import { getClient } from '../db';

type ecdcDatum = {
    dataRep: number,
    day: number,
    month: number,
    year: number,
    cases: number,
    deaths: number,
    countriesAndTerritories: string,
    geoId: string,
    countryterritoryCode: string,
    popData2018: string;
} 

const csvParse = async (buf) => {
    return new Promise((resolve, reject) => {
        CSV.parse(buf.data, {
            columns: true
        }, (err, data) => {
            if(err) return reject(err);
            return resolve(data);
        });
    });
}

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

export const getECDCData = async () => {
    return axios({
        url: 'https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-2020-04-04.xlsx',
        method: 'GET',
        responseType: 'arraybuffer', // important
    }).then((body) => {
        const workbook = xlsx.read(body.data);
        const sheetNameList = workbook.SheetNames;
        const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
        return json as ecdcDatum[];
    });
}

export const loadNYTData = async() => {
    const [states, counties] =  await getNYTData();
    await loadNYTCounties(counties);
    await loadNYTStates(states);
}

export const loadECDCData =  async () => {
    const client = await getClient();
    const data = await getECDCData();
    client.query('begin;');
    client.query('truncate ecdc;');

    const query = `INSERT INTO 
        ecdc(date, 
            cases, 
            deaths, 
            countries_and_territories,
            geo_id,
            country_territory_code,
            pop_data_2018) 
        VALUES($1, $2, $3, $4, $5, $6, $7)`

    data.forEach(async (d) => {
        await client.query(query, [
            (new Date(d.year, d.month - 1, d.day)).toISOString(),
            d.cases,
            d.deaths,
            d.countriesAndTerritories,
            d.geoId,
            d.countryterritoryCode,
            d.popData2018
        ]).catch((e) => {
            console.error(e);
        })
    })
    client.query('commit;');
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