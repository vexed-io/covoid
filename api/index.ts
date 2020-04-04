import * as koa from 'koa';
import * as router from 'koa-joi-router';
import * as staticServer from 'koa-static';
import { getStateCaseData, getStateTotals, getStates, getMaxDate, getCountryCaseData, getStateCountyTotals } from './services';
import * as cors from '@koa/cors';
import { getNYTData, loadECDCData, getECDCData, loadNYTData } from './services/data-importers';
import * as cache from './services/cache';
import { init } from './db';
// import * as forceHTTPS from 'koa-force-https';


const joi = router.Joi;
const route = router();

route.get('/', async(ctx) => {
    ctx.redirect('/covid.html');
});

route.get('/covid_api/state_case', async (ctx) => {
    const state = ctx.query.state;
    const cacheKey = `state_case:${state}`;

    if(!cache.get(cacheKey)) {

        if (ctx.query.state === 'US') {
            cache.set(cacheKey, await getCountryCaseData(ctx.query.days))
        }
        else {
            cache.set(cacheKey,  await getStateCaseData(ctx.query.state, ctx.query.days))
        }
    }

    ctx.body = cache.get(cacheKey);
});

route.get('/covid_api/state_total', async (ctx) => {
    const state = ctx.query.state;
    const cacheKey = `state_total:${state}`;

    if(!cache.get(cacheKey)) {
        if (ctx.query.state === 'US') {
            cache.set(cacheKey, await getStateTotals());
        }
        else {
            cache.set(cacheKey, await getStateCountyTotals(ctx.query.state));
        }
    }

    ctx.body = cache.get(cacheKey);
});


route.get('/covid_api/states', async (ctx) => {
    const cacheKey = `states`;
    if(!cache.get(cacheKey)) {
        cache.set(cacheKey, await getStates());
    }
    ctx.body = cache.get(cacheKey);
});

route.get('/covid_api/current_date', async (ctx) => {
    const cacheKey = `current_date`;
    if(!cache.get(cacheKey)) {
        cache.set(cacheKey, await getMaxDate());
    }
    ctx.body = cache.get(cacheKey);
});

route.get('/covid_api/ecdc', async(ctx) => {
    ctx.body = await getECDCData();
})

route.get('/covid_api/nyt', async(ctx) => {
    ctx.body = await getNYTData();
})

route.get('/covid_api/load/nyt', async(ctx) => {
    await loadNYTData();
    cache.reset();
    ctx.body = 'success';
})
route.get('/covid_api/load/ecdc', async(ctx) => {
    await loadECDCData();
    cache.reset();
    ctx.body = 'success';
})

const app = new koa();
app.use(staticServer('./client'));
app.use(cors());
app.use(route.middleware());
(async () => {
    await init;
    app.listen(process.env.PORT || 3000, () => {
        console.log(JSON.stringify({message: 'Started server', port: process.env.PORT}))
    });
})()