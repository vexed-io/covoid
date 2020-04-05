import { reset } from "../services/cache";
import { loadJHUData } from "../services/etl/jhu";

(async () => {
    await loadJHUData();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
