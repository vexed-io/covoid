// European Center for Diseas Control

import axios from 'axios';
import { getClient } from "../../db";
import * as xlsx from 'xlsx';

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

function getFormattedDate (date) {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2)
    const day = ("0" + (date.getDate() + 1)).slice(-2)
    return `${year}-${month}-${day}`;
}

export const getECDCData = async (date = new Date(), tries = 0) => {
    if (tries++ > 4) {
        throw `Can't get ecdc data`;
    }
    const now = new Date(date);
    const yesterday = (new Date(now.setDate(now.getDate() -1)));

    try {
        return await axios({
            url: `https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-${getFormattedDate(now)}.xlsx`,
            method: 'GET',
            responseType: 'arraybuffer',
        }).then((body) => {
            const workbook = xlsx.read(body.data);
            const sheetNameList = workbook.SheetNames;
            const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
            return json as ecdcDatum[];
        })
    } catch (e) {
        return getECDCData(yesterday, tries);
    }
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
    await client.query('commit;');
    await client.release();
}