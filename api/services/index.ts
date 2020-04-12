import { getClient } from "../db";

export const getCaseData =  async (state, days) => { 
    if (state === 'US') {
        return  getCountryCaseData(days)
    }
    return getStateCaseData(state, days)
}

export const getCountryCaseData = async (days, source ='nyt') => {
    const client = await getClient();
    const bindParams = [days, source];
    const response = await client.query(`
            select date :: date :: text, 
                sum(cases) cases,
                sum(deaths) deaths,
                sum(cases_yesterday)::numeric as cases_yesterday,
                sum(deaths_yesterday)::numeric as deaths_yesterday,
                (sum(cases) / nullif(sum(cases_yesterday)::numeric, 0)) - 1 as percent_increase_cases,
                (sum(deaths) /  nullif(sum(deaths_yesterday)::numeric, 0)) - 1 as percent_increase_deaths 
            from (
                select
                    date,
                    state,
                    county,
                    cases,
                    deaths,
                    lag(cases, 1) over (partition by state, county order by date asc) as cases_yesterday,
                    lag(deaths, 1) over (partition by state, county order by date asc) as deaths_yesterday
                from covid_stats
                where source = $2 and cases > 0) t 
            group by 1 
            order by date desc
        limit $1
    `, bindParams);
    await client.release();
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
        from nyt_state
        where cases > 0  
        ${state ? 'and state = $2' : ''}
        order by 1 desc
        limit $1
    `, bindParams);
    await client.release();
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
        from nyt_state
        where deaths > 0  
        ${state ? 'and state = $1' : ''}
        order by date desc;
    `, bindParams);
    await client.release();
    return response.rows;
};

export const getUSTotals = async () => {
    const client = await getClient();
    const response = await client.query(`
        select sum(cases) from nyt_state where date = (select max(date) from nyt_state);
    `);
    await client.release();
    return response.rows[0];
};

export const getStateCountyTotals = async (state) => {
    const client = await getClient();
    const response = await client.query(`
        select 
            county as state, 
            sum(cases) 
        from nyt_counties 
        where date = (select max(date) from nyt_counties)
        and state = $1
        group by 1
        order by 2 desc;
    `, [state]);
    await client.release();
    return response.rows;
};

export const getFastestGrowingRegion = async (state) => {
    const client = await getClient();
    const forCountry = state === 'US';

    const bind = !forCountry ? [state] : []

    const ret = (await client.query(`
    select 
        state, 
        (max(cases*1.0) / nullif(min(cases), 0)) - 1 as percent
    from (
        select * 
            from (select 
                date, 
                ${forCountry ? 'state': 'county'} as state, 
                cases, 
                rank() over (partition by ${forCountry ? 'state': 'county'} order by date desc) 
            from ${forCountry ? 'nyt_state': 'nyt_counties'} 
            ${!forCountry 
                ? "where state = $1" : ''}
            order by date desc) t 
        where rank <= 2) a 
    where state != 'Unknown' 
    group by state 
    having max(cases)  > 10
    order by 2 desc 
    limit 1;
    `, bind)).rows[0];
    await client.release();
    return ret;
}

export const getStateTotals = async () => {
    const client = await getClient();
    const response = await client.query(`
        select 
            state, 
            sum(cases) 
        from nyt_state 
        where date = (select max(date) from nyt_state) 
        group by 1
        order by 2 desc;
    `);
    await client.release();
    return response.rows;
};

export const getStates = async () => {
    const client = await getClient();
    const response = await client.query(`
        select distinct state from nyt_state order by state asc;
    `);
    await client.release();
    const states  = response.rows;
    states.unshift({ state: 'US'});
    return states;
}

type stats = {
    cases: number,
    case_delta: number,
    case_percent_increase_today: number,
    case_percent_increase_yesterday: number,
    deaths: number,
    death_delta: number,
    death_percent_increase_today: number,
    death_percent_increase_yesterday: number,
    fastest_state: any,
}

export const getStats = async (state): Promise<stats> => {
    const data = await getCaseData(state, 4);

    return {
        cases : +data[0].cases,
        case_delta : data[0].cases - data[1].cases,
        case_percent_increase_today : (data[0].cases / data[1].cases) - 1,
        case_percent_increase_yesterday : (data[1].cases / data[2].cases) - 1,
        deaths : +data[0].deaths,
        death_delta : data[0].deaths - data[1].deaths,
        death_percent_increase_today : (data[0].deaths / data[1].deaths) - 1,
        death_percent_increase_yesterday : (data[1].deaths / data[2].deaths) - 1,
        fastest_state: await getFastestGrowingRegion(state)
    }
}

const getState = async(state) => {


};

export const getMaxDate = async () => {    
    const client = await getClient();
    const response = await client.query(`
        select max(date)::text date from nyt_state;
    `);
    await client.release();
    return response.rows[0];
}



export const registerEmail = async (email) => {
    const client = await getClient();
    const response = await client.query(`
        insert into emails (email) values ($1);
    `, [email]);
    await client.release();
    return response.rows[0];
}