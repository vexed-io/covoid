import * as koa from 'koa';
import * as router from 'koa-joi-router';
import * as staticServer from 'koa-static';
import { getStateCaseData, getStateTotals, getStates, getMaxDate, getCountryCaseData, getStateCountyTotals } from './services';
import * as cors from '@koa/cors';
import * as cache from './services/cache';
import * as helmet from 'koa-helmet';
import { init } from './db';
import { getECDCData, loadECDCData } from './services/etl/ecdc';
import { getNYTData, loadNYTData } from './services/etl/nyt';
import { getWHOData, loadWHOData } from './services/etl/who';
import { getJHUData, loadJHUData } from './services/etl/jhu';


const joi = router.Joi;
const route = router();

route.get('/', async(ctx) => {
    ctx.redirect('/covid');
});

route.get('/covid', async(ctx) => {
    ctx.redirect('/covid');
});

route.get('/covid_api/state_case', async (ctx) => {
    const state = ctx.query.state;
    const days = ctx.query.days;
    const cacheKey = `state_case:${state}:${days}`;

    if(!cache.get(cacheKey)) {

        if (ctx.query.state === 'US') {
            cache.set(cacheKey, await getCountryCaseData(days))
        }
        else {
            cache.set(cacheKey,  await getStateCaseData(state, days))
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

route.get('/covid_api/who', async(ctx) => {
    ctx.body = await getWHOData();
})

route.get('/covid_api/jhu', async(ctx) => {
    ctx.body = await getJHUData();
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

route.get('/covid_api/load/who', async(ctx) => {
    await loadWHOData();
    cache.reset();
    ctx.body = 'success';
})

route.get('/covid_api/load/jhu', async(ctx) => {
    await loadJHUData();
    cache.reset();
    ctx.body = 'success';
})




const app = new koa();

app.use(helmet());

app.use(staticServer('./client', {
    maxage: 1000*60*5,
    extensions: ['html', '.js']
}));

app.use(cors());

app.use(route.middleware());

(async () => {
    await init;
    app.listen(process.env.PORT || 3000, () => {
        console.log(JSON.stringify({message: 'Started server', port: process.env.PORT}))
    });
})()