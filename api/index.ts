import * as koa from 'koa';
import * as router from 'koa-joi-router';
import * as staticServer from 'koa-static';
import { getClient } from './db';
import { getStateDeathData, getStateCaseData, getUSTotals, getStateTotals, getStates, getMaxDate, getCountryCaseData, getStateCountyTotals } from './services';
import * as cors from '@koa/cors';
// import * as forceHTTPS from 'koa-force-https';


const joi = router.Joi;
const route = router();


route.get('/covid_api/state_case', async (ctx) => {
    const client = await getClient;
    if (ctx.query.state === 'US') {
        ctx.body = await getCountryCaseData(ctx.query.days);
    }
    else {
        ctx.body = await getStateCaseData(ctx.query.state, ctx.query.days);
    }
});

// route.get('/covid_api/us_total', async (ctx) => {
//     ctx.body = await getUSTotals();
// });

route.get('/covid_api/state_total', async (ctx) => {
    if (ctx.query.state === 'US') {
        ctx.body = await getStateTotals();
    }
    else {
        ctx.body = await getStateCountyTotals(ctx.query.state);
    }
});

route.get('/covid_api/states', async (ctx) => {
    ctx.body = await getStates();
});

route.get('/covid_api/current_date', async (ctx) => {
    ctx.body = await getMaxDate();
});

const app = new koa();
app.use(staticServer('./client'));
app.use(cors());
// app.use(forceHTTPS());
app.use(route.middleware());
app.listen(process.env.PORT || 3000, () => {
    console.log(JSON.stringify({message: 'Started server', port: process.env.PORT}))
});