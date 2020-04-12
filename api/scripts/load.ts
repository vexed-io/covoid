import { loadECDCData } from '../services/etl/ecdc';
import { loadJHUData } from '../services/etl/jhu';
import { loadNYTData } from '../services/etl/nyt';
import { recalcStats } from '../db/db-structure';
import { loadWHOData } from '../services/etl/who';
import { reset } from '../services/cache';

(async () => {
    const loads = await Promise.all([loadECDCData(), loadJHUData(), loadNYTData(), loadWHOData()]);
    const build_schema = await recalcStats();
    await reset();
    return {
        loads,
        build_schema
    }
})().then(console.log).catch(console.error).finally(() => process.exit())