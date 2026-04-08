
const { getPool, sql } = require('../config/db');
const { mapTransaction } = require('./_serializers');

async function findAll() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT *
    FROM [dbo].[ArchivedTransactions]
    ORDER BY [archivedAt] DESC;
  `);

  return result.recordset.map(mapTransaction);
}

async function insertMany(transactions) {
  if (!transactions.length) {
    return [];
  }

  const pool = await getPool();
  const inserted = [];

  for (const transaction of transactions) {
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, transaction.id || transaction._id)
      .input('userId', sql.UniqueIdentifier, transaction.userId)
      .input('description', sql.NVarChar(sql.MAX), transaction.description || null)
      .input('amount', sql.Decimal(18, 2), Number(transaction.amount))
      .input('category', sql.NVarChar(255), transaction.category || null)
      .input('date', sql.DateTime2, transaction.date)
      .input('type', sql.NVarChar(50), transaction.type || null)
      .input('vendor', sql.NVarChar(255), transaction.vendor || null)
      .input('source', sql.NVarChar(50), transaction.source || null)
      .input('referenceNumber', sql.NVarChar(255), transaction.referenceNumber || null)
      .input('metadata', sql.NVarChar(sql.MAX), transaction.metadata ? JSON.stringify(transaction.metadata) : null)
      .input('bank', sql.NVarChar(255), transaction.bank || null)
      .input('createdAt', sql.DateTime2, transaction.createdAt || new Date())
      .input('updatedAt', sql.DateTime2, transaction.updatedAt || new Date())
      .query(`
        INSERT INTO [dbo].[ArchivedTransactions] (
          [id], [userId], [description], [amount], [category], [date],
          [type], [vendor], [source], [referenceNumber], [metadata], [bank],
          [createdAt], [updatedAt]
        )
        OUTPUT inserted.*
        VALUES (
          @id, @userId, @description, @amount, @category, @date,
          @type, @vendor, @source, @referenceNumber, @metadata, @bank,
          @createdAt, @updatedAt
        );
      `);

    inserted.push(mapTransaction(result.recordset[0]));
  }

  return inserted;
}

module.exports = {
  findAll,
  insertMany,
};
