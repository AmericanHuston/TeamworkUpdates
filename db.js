import fs from "fs/promises";

let writeQueue = Promise.resolve();

async function saveDatabase(db) {
    const snapshot = JSON.stringify(db);

    const write = writeQueue.then(async () => {
        await fs.writeFile('./db.json.tmp', snapshot, 'utf8');
        await fs.rename('./db.json.tmp', './db.json');
    });

    writeQueue = write.catch(() => { });
    return write;
}

export default {saveDatabase}