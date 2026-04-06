const { getPool, sql } = require('../config/db');
const { mapTransaction, serializeMetadata } = require('./_serializers');

function bindTransactionInputs(request, data) {
  return request
    .input('userId', sql.UniqueIdentifier, data.userId)
    .input('amount', sql.Decimal(18, 2), Number(data.amount))
    .input('category', sql.NVarChar(255), data.category || 'Other')
    .input('date', sql.DateTime2, data.date || new Date())
    .input('source', sql.NVarChar(50), data.source)
    .input('description', sql.NVarChar(sql.MAX), data.description || null)
    .input('type', sql.NVarChar(50), data.type || 'unknown')
    .input('vendor', sql.NVarChar(255), data.vendor || null)
    .input('referenceNumber', sql.NVarChar(255), data.referenceNumber || null)
    .input('metadata', sql.NVarChar(sql.MAX), serializeMetadata(data.metadata))
    .input('bank', sql.NVarChar(255), data.bank || null);
}

async function create(data) {
  const pool = await getPool();
  const result = await bindTransactionInputs(pool.request(), data).query(`
    INSERT INTO [dbo].[Transactions] (
      [userId], [amount], [category], [date], [source],
      [description], [type], [vendor], [referenceNumber], [metadata], [bank]
    )
    OUTPUT inserted.*
    VALUES (
      @userId, @amount, @category, @date, @source,
      @description, @type, @vendor, @referenceNumber, @metadata, @bank
    );
  `);

  return mapTransaction(result.recordset[0]);
}

async function upsertByReferenceNumber(referenceNumber, data) {
  const pool = await getPool();
  const result = await bindTransactionInputs(
    pool.request().input('mergeReferenceNumber', sql.NVarChar(255), referenceNumber),
    { ...data, referenceNumber }
  ).query(`
    MERGE [dbo].[Transactions] AS target
    USING (SELECT @mergeReferenceNumber AS [referenceNumber]) AS source
    ON target.[referenceNumber] = source.[referenceNumber]
    WHEN MATCHED THEN
      UPDATE SET
        [userId] = @userId,
        [amount] = @amount,
        [category] = @category,
        [date] = @date,
        [source] = @source,
        [description] = @description,
        [type] = @type,
        [vendor] = @vendor,
        [metadata] = @metadata,
        [bank] = @bank,
        [updatedAt] = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        [userId], [amount], [category], [date], [source],
        [description], [type], [vendor], [referenceNumber], [metadata], [bank]
      )
      VALUES (
        @userId, @amount, @category, @date, @source,
        @description, @type, @vendor, @referenceNumber, @metadata, @bank
      )
    OUTPUT inserted.*;
  `);

  return mapTransaction(result.recordset[0]);
}

async function findAll({ userId, category, limit }) {
  const pool = await getPool();
  const request = pool.request()
    .input('userId', sql.UniqueIdentifier, userId);

  const whereClauses = ['[userId] = @userId'];
  if (category && category !== 'All') {
    request.input('category', sql.NVarChar(255), category);
    whereClauses.push('[category] = @category');
  }

  const topClause = limit ? `TOP (${Number(limit)})` : '';
  const result = await request.query(`
    SELECT ${topClause} *
    FROM [dbo].[Transactions]
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY [date] DESC;
  `);

  return result.recordset.map(mapTransaction);
}

async function existsByReferenceNumber(referenceNumber) {
  if (!referenceNumber) return false;

  const pool = await getPool();
  const result = await pool.request()
    .input('referenceNumber', sql.NVarChar(255), referenceNumber)
    .query(`
      SELECT TOP (1) 1 AS [exists]
      FROM [dbo].[Transactions]
      WHERE [referenceNumber] = @referenceNumber;
    `);

  return Boolean(result.recordset[0]);
}

module.exports = {
  create,
  upsertByReferenceNumber,
  findAll,
  existsByReferenceNumber,
};
