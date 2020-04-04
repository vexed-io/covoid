import { loadNYTData } from "../services/data-importers";
import { reset } from "../services/cache";

(async () => {
    await loadNYTData();
    reset();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
