import { reset } from "../services/cache";
import { loadJHUData } from "../services/etl/jhu";
import { recalcStats } from "../db/db-structure";

(async () => {
    await recalcStats();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
