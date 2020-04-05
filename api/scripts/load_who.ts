import { reset } from "../services/cache";
import { loadWHOData } from "../services/etl/who";

(async () => {
    await loadWHOData();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
