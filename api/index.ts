import * as koa from 'koa';
import * as router from 'koa-joi-router';
import * as staticServer from 'koa-static';
import { getClient } from './db';
import { getStateDeathData, getStateCaseData, getUSTotals, getStateTotals, getStates, getMaxDate, getCountryCaseData, getStateCountyTotals } from './services';
import * as cors from '@koa/cors';
import { getNYTData, loadECDCData, getECDCData, loadNYTData } from './services/data-importers';
import { migrateDatabase } from './services/db-structure';
// import * as forceHTTPS from 'koa-force-https';


const joi = router.Joi;
const route = router();

let cache = {

}


route.get('/covid_api/state_case', async (ctx) => {
    const state = ctx.query.state;
    const cacheKey = `state_case:${state}`;

    if(!cache[cacheKey]) {
        const client = await getClient;
        if (ctx.query.state === 'US') {
            cache[cacheKey] = await getCountryCaseData(ctx.query.days);
        }
        else {
            cache[cacheKey] = await getStateCaseData(ctx.query.state, ctx.query.days);
        }
    }

    ctx.body = cache[cacheKey];
});

route.get('/covid_api/state_total', async (ctx) => {
    const state = ctx.query.state;
    const cacheKey = `state_total:${state}`;

    if(!cache[cacheKey]) {
        if (ctx.query.state === 'US') {
             cache[cacheKey] = await getStateTotals();
        }
        else {
             cache[cacheKey] = await getStateCountyTotals(ctx.query.state);
        }
    }

    ctx.body = cache[cacheKey];
});


route.get('/covid_api/states', async (ctx) => {
    const cacheKey = `states`;
    if(!cache[cacheKey]) {
        cache[cacheKey] =  await getStates();
    }
    ctx.body = cache[cacheKey];
});

route.get('/covid_api/current_date', async (ctx) => {
    const cacheKey = `current_date`;
    if(!cache[cacheKey]) {
        cache[cacheKey] = await getMaxDate();
    }
    ctx.body = cache[cacheKey];
});

route.get('/covid_api/ecdc', async(ctx) => {
    ctx.body = await getECDCData();
})

route.get('/covid_api/nyt', async(ctx) => {
    ctx.body = await getNYTData();
})

route.get('/covid_api/load/nyt', async(ctx) => {
    await loadNYTData();
    cache = {};
    ctx.body = 'success';
})
route.get('/covid_api/load/ecdc', async(ctx) => {
    await loadECDCData();
    cache = {};
    ctx.body = 'success';
})

const app = new koa();
app.use(staticServer('./client'));
app.use(cors());
// app.use(forceHTTPS());
app.use(route.middleware());
(async () => {
    await migrateDatabase();
    app.listen(process.env.PORT || 3000, () => {
        console.log(JSON.stringify({message: 'Started server', port: process.env.PORT}))
    });
})()