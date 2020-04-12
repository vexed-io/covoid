import * as koa from 'koa';
import * as staticServer from 'koa-static';
import * as cors from '@koa/cors';
import * as helmet from 'koa-helmet';
import { init } from './db';
import route from './routes';
import * as bodyparser from 'koa-bodyparser';


const app = new koa();

app.use(helmet());
app.use(bodyparser());

app.use(cors());

app.use(route.middleware());
app.use(staticServer('./client', {
    maxAge: 1000*60*5,
    extensions: ['html', '.js']
}));

(async () => {
    await init;
    app.listen(process.env.PORT || 3000, () => {
        console.log(JSON.stringify({message: 'Started server', port: process.env.PORT}))
    });
})()