import { reset } from "../services/cache";
import { loadNYTData } from "../services/etl/nyt";

(async () => {
    await loadNYTData();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
