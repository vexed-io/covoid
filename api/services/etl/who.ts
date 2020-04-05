import axios from 'axios';
import { getClient } from "../../db";
import { csvParse } from "./util";


export const getWHOData = async () => {
    return await axios({
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBI8MZx7aNt8EjYqkeojTopZKwSYGWCSKUzyS9xobrS5Tfr9SQZ_4hrp3dv6bRGkHk2dld0wRrJIeV/pub?gid=32379430&single=true&output=csv',
        method: 'GET',
        responseType: 'arraybuffer', // important
    }).then(csvParse) as any[]
}

export const loadWHOData = async () => {
    const client = await getClient();
    const data = await getWHOData();
    client.query('begin;');
    client.query('truncate who;');


    const query = `INSERT INTO 
        who(date, 
            cases, 
            deaths, 
            admin_name,
            lat,
            lon) 
        VALUES($1, $2, $3, $4, $5, $6)`

    await Promise.all(data.map(async (d) => {
        await client.query(query, [
            d.DateOfDataEntry,
            parseInt(d.cum_conf),
            parseInt(d.cum_death),
            d.ADM0_NAME,
            parseInt(d.CENTER_LAT),
            parseInt(d.CENTER_LON)
        ]).catch((e) => {
            console.error(e);
        })
    }))
    await client.query('commit;');
}


