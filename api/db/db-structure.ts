import { promises } from 'fs';
import { getClient } from '.';

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
            jhu_cases.lat, 
            jhu_cases.lon 
        from jhu_cases 
            join jhu_deaths using(date, country, province) 
            join jhu_recoveries using (date, country, province)
    );
    
    
    create table if not exists emails (
        id serial,
        email text not null ,
        created_at timestamp default current_timestamp
    );

    create materialized view if not exists jhu as (
        select date, 
            country, 
            province, 
            cases, 
            deaths, 
            recoveries, 
            jhu_cases.lat, 
            jhu_cases.lon 
        from jhu_cases 
            join jhu_deaths using(date, country, province) 
            join jhu_recoveries using (date, country, province)
    );
    
    create table if not exists covid_stats (  
        country text, 
        state text, 
        county text, 
        date date,
        cases integer,
        deaths integer,
        recoveries integer,
        source text
    );
    
    
    `); 
}

export const recalcStats = async () => {
    const client = await getClient();
    await client.query(`
        refresh materialized view jhu;

        begin;

        truncate covid_stats;

        insert into covid_stats (country, state, date, cases, deaths, recoveries, source) (
            select country, province, date, cases, deaths, recoveries, 'jhu' from jhu
        );

        insert into covid_stats (country, state, county, date, cases, deaths, source) (
            select 'US', state, county, date, cases, deaths, 'nyt' from nyt_counties
        );

        insert into covid_stats (country, date, cases, deaths, source) (
            select admin_name, date, cases, nullif(deaths, 'NaN'), 'who' from who
        );

        insert into covid_stats (country, date, cases, deaths, source) (
            select countries_and_territories, date, cases, deaths, 'ecdc' from ecdc
        );

        commit;
    `);
    return await client.release();
}