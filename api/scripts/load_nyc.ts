import { migrateDatabase } from "../services/db-structure";
import { loadNYTData } from "../services/data-importers";

(async () => {
    await migrateDatabase();
    await loadNYTData();
    return 'success';
})().then(console.log).catch(console.error).finally(() => process.exit());
