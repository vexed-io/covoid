import { promises } from 'fs';

async function readModuleFile(path) {
    var filename = require.resolve(path);
    return promises.readFile(filename, 'utf8');
}


export const migrateDatabase = async (client) => {

    return await client.query(`create table if not exists nyt_state ( 
        date date, 
        state text, 
        fips numeric, 
        cases integer, 
        deaths integer
    );
    
    create index if not exists nyt_state_date on nyt_state (date);
    create index if not exists nyt_state_state_date on nyt_state (state, date);
    
    create table if not exists nyt_counties ( 
        date date, 
        county text,
        state text, 
        fips numeric, 
        cases integer, 
        deaths integer
    );
    
    create index if not exists  nyt_counties_date on nyt_counties (date);
    create index if not exists  nyt_counties_county_date on nyt_counties (county, date);
    
    create table if not exists ecdc (
        date date,
        cases integer, 
        deaths integer,
        countries_and_territories text,
        geo_id text,
        country_territory_code text,
        pop_data_2018 integer
    );
    
    create index if not exists  ecdc_date on ecdc (date);
    create index if not exists  ecdc_date_countries_and_territories on ecdc (countries_and_territories, date);
    
    create table if not exists locations (
        name text,
        level text,
        parent text
    );

    create table if not exists who (
        date date,
        admin_name text,
        cases numeric,
        deaths numeric,
        lat numeric,
        lon numeric
    );

    create table if not exists jhu_cases (
        date date,
        cases numeric,
        country text,
        province text,
        lat numeric,
        lon numeric
    );
    
    create table if not exists jhu_deaths (
        date date,
        deaths numeric,
        country text,
        province text,
        lat numeric,
        lon numeric
    );

    create table if not exists jhu_recoveries (
        date date,
        recoveries numeric,
        country text,
        province text,
        lat numeric,
        lon numeric
    );

    create materialized view if not exists jhu as (
        select date, 
            country, 
            province, 
            cases, 
            deaths, 
            recoveries, 
            jhu_case.lat, 
            jhu_case.lon 
        from jhu_case 
            join jhu_death using(date, country, province) 
            join jhu_recovery using (date, country, province)
    );`); 
}