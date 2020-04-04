create table if not exists nyt_state ( 
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