import { loadECDCData } from '../services/etl/ecdc';
import { loadJHUData } from '../services/etl/jhu';
import { loadNYTData } from '../services/etl/nyt';
import { recalcStats } from '../db/db-structure';
import { loadWHOData } from '../services/etl/who';
import { reset } from '../services/cache';

(async () => {
    // await loadECDCData();
    // await loadJHUData();
    await loadNYTData();
    // await loadWHOData();
    await reset();
})().then(console.log).catch(console.error).finally(() => process.exit())