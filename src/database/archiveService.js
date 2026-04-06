const { getPool, sql } = require('../config/db');

exports.archiveOldTransactions = async () => {
  const pool = await getPool();
  const dbTransaction = new sql.Transaction(pool);

  try {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // >2 years old

    await dbTransaction.begin();

    const previewResult = await new sql.Request(dbTransaction)
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        SELECT *
        FROM [dbo].[Transactions]
        WHERE [date] < @cutoffDate;
      `);

    if (!previewResult.recordset.length) {
      await dbTransaction.rollback();
      console.log('[ArchiveService] No old transactions found.');
      return;
    }

    await new sql.Request(dbTransaction)
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        INSERT INTO [dbo].[ArchivedTransactions] (
          [id], [userId], [description], [amount], [category], [date],
          [type], [vendor], [source], [referenceNumber], [metadata], [bank],
          [createdAt], [updatedAt]
        )
        SELECT
          [id], [userId], [description], [amount], [category], [date],
          [type], [vendor], [source], [referenceNumber], [metadata], [bank],
          [createdAt], [updatedAt]
        FROM [dbo].[Transactions]
        WHERE [date] < @cutoffDate;
      `);

    await new sql.Request(dbTransaction)
      .input('cutoffDate', sql.DateTime2, cutoffDate)
      .query(`
        DELETE FROM [dbo].[Transactions]
        WHERE [date] < @cutoffDate;
      `);

    await dbTransaction.commit();

    console.log(`[ArchiveService] Archived ${previewResult.recordset.length} transactions.`);
  } catch (err) {
    if (dbTransaction._aborted !== true) {
      try {
        await dbTransaction.rollback();
      } catch {
      }
    }
    console.error('[ArchiveService] Error archiving transactions:', err);
  }
};
