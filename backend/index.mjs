import https from 'https';
import config from './config.mjs';
import app from './app.mjs';
import getDB from './database.mjs';

const db = await getDB(config().dbName);
app.db = db;




// Start server
const httpsServer = https.createServer(config().credentials, app);

httpsServer.listen(config().port, () => {
    console.log("HTTPS server is running");
});

