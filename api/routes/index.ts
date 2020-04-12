import * as router from 'koa-joi-router';
import { getStateCaseData, getStateTotals, getStates, getMaxDate, getCountryCaseData, getStateCountyTotals, getStats, getCaseData, registerEmail } from '../services';
import * as cache from '../services/cache';
import { getECDCData, loadECDCData } from '../services/etl/ecdc';
import { getNYTData, loadNYTData } from '../services/etl/nyt';
import { getWHOData, loadWHOData } from '../services/etl/who';
import { getJHUData, loadJHUData } from '../services/etl/jhu';


const route = router();

route.get('/', async(ctx) => {
    ctx.redirect('/covid');
});

route.post('/email', async(ctx) => {
    ctx.body = registerEmail(ctx.request.body.email);
});

route.get('/covid', async(ctx) => {
    ctx.redirect('/covid');
});

route.get('/covid_api/stats', async(ctx) => {
    const state = ctx.query.state;
    const cacheKey = `stats:${state}`;

    if(!await cache.get(cacheKey)) {
        await cache.set(cacheKey, await getStats(state))
    }
    ctx.body = await cache.get(cacheKey);
});

route.get('/covid_api/state_case', async (ctx) => {
    const state = ctx.query.state;
    const days = ctx.query.days;
    const cacheKey = `state_case:${state}:${days}`;

    if(!await cache.get(cacheKey)) {
        await cache.set(cacheKey, await getCaseData(state, days))
    }

    ctx.body = await cache.get(cacheKey);
});

route.get('/covid_api/state_total', async (ctx) => {
    const state = ctx.query.state;
    const cacheKey = `state_total:${state}`;

    if(!await cache.get(cacheKey)) {
        if (ctx.query.state === 'US') {
            await cache.set(cacheKey, await getStateTotals());
        }
        else {
            await cache.set(cacheKey, await getStateCountyTotals(ctx.query.state));
        }
    }

    ctx.body = await cache.get(cacheKey);
});


route.get('/covid_api/states', async (ctx) => {
    const cacheKey = `states`;
    if(!await cache.get(cacheKey)) {
        await cache.set(cacheKey, await getStates());
    }
    ctx.body = await cache.get(cacheKey);
});

route.get('/covid_api/current_date', async (ctx) => {
    const cacheKey = `current_date`;
    if(!await cache.get(cacheKey)) {
        await cache.set(cacheKey, await getMaxDate());
    }
    ctx.body = await cache.get(cacheKey);
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

export default route;