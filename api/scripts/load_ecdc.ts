import { loadECDCData } from "../services/etl/ecdc";
import { reset } from "../services/cache";

(async () => {
    await loadECDCData();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
