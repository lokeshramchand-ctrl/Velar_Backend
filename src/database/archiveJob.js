require('dotenv').config({ 
  path: require('path').resolve(__dirname, '../.env') 
});

const cron = require('node-cron');
const connectDB = require('../config/db'); // ✅ central DB logic
const { archiveOldTransactions } = require('../database/archiveService');

(async () => {
  try {
    console.log('[ArchiveJob] Loaded MSSQL_SERVER:', process.env.MSSQL_SERVER || 'Not found');

    await connectDB();
    console.log('[ArchiveJob] Connected to MSSQL');

    cron.schedule('0 2 1 * *', async () => {
      console.log('[ArchiveJob] Running monthly archive...');
      try {
        await archiveOldTransactions();
        console.log('[ArchiveJob] Archive completed successfully');
      } catch (err) {
        console.error('[ArchiveJob] Archive failed', err);
      }
    });

    console.log('[ArchiveJob] Cron job scheduled (runs 1st of month @ 2AM)');
  } catch (err) {
    console.error('[ArchiveJob] Startup Error:', err.message);
    process.exit(1);
  }
})();
