import { getClient } from "../db";

export const getCountryCaseData = async (days) => {
    const client = await getClient();
    const bindParams = [days];
    const response = await client.query(`
        select date, 
            sum(cases) cases,
            sum(deaths) deaths,
            (sum(cases) / nullif(sum(cases_yesterday)::numeric, 0)) - 1 as percent_increase_cases,
            (sum(deaths) /  nullif(sum(deaths_yesterday)::numeric, 0)) - 1 as percent_increase_deaths 
        from (
            select
                date :: date :: text,
                state,
                cases,
                deaths,
                lag(cases, 1) over (partition by state order by date asc) as cases_yesterday,
                lag(deaths, 1) over (partition by state order by date asc) as deaths_yesterday
            from covid_state
            where cases > 0) t 
        group by 1 
        order by date desc
        limit $1
    `, bindParams);
    return response.rows;
};
export const getStateCaseData = async (state, days) => {
    const client = await getClient();
    const bindParams =  state ? [days, state] : [days];
    const response = await client.query(`
        select 
            date :: date :: text, 
            state, 
            cases, 
            deaths,
            ((cases::numeric / nullif(lag(cases, 1) over (partition by state order by date asc), 0) - 1)) as percent_increase_cases, 
            ((deaths::numeric / nullif(lag(deaths, 1) over (partition by state order by date asc), 0) - 1)) as percent_increase_deaths   
        from covid_state
        where cases > 0  
        ${state ? 'and state = $2' : ''}
        order by 1 desc
        limit $1
    `, bindParams);
    return response.rows;
};

export const getStateDeathData = async (state) => {
    const client = await getClient();
    const bindParams =  state ? [state] : [];
    const response = await client.query(`
        select 
            date :: date :: text, 
            state, 
            deaths, 
            ((deaths::numeric / lag(deaths, 1) over (partition by state order by date asc) - 1)) as percent_increase_deaths   
        from covid_state
        where deaths > 0  
        ${state ? 'and state = $1' : ''}
        order by date desc;
    `, bindParams);
    return response.rows;
};

export const getUSTotals = async () => {
    const client = await getClient();
    const response = await client.query(`
        select sum(cases) from covid_state where date = (select max(date) from covid_state);
    `);
    return response.rows[0];
};

export const getStateCountyTotals = async (state) => {
    const client = await getClient();
    const response = await client.query(`
        select 
            county as state, 
            sum(cases) 
        from covid_county 
        where date = (select max(date) from covid_county)
        and state = $1
        group by 1
        order by 2 desc;
    `, [state]);
    return response.rows;
};

export const getStateTotals = async () => {
    const client = await getClient();
    const response = await client.query(`
        select 
            state, 
            sum(cases) 
        from covid_state 
        where date = (select max(date) from covid_state) 
        group by 1
        order by 2 desc;
    `);
    return response.rows;
};

let states;
export const getStates = async () => {
    if (states) return states;
    
    const client = await getClient();
    const response = await client.query(`
        select distinct state from covid_state order by state asc;
    `);
    states  = response.rows;
    states.unshift({ state: 'US'});
    return states;
}

let maxDate;
export const getMaxDate = async () => {
    if (maxDate) return maxDate;
    
    const client = await getClient();
    const response = await client.query(`
        select max(date)::text date from covid_state;
    `);
    maxDate  = response.rows[0];
    return maxDate;
}

