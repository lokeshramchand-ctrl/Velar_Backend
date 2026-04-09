const { getPool, sql } = require('../config/db');
const { mapUser } = require('./_serializers');

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT * FROM [dbo].[Users] WHERE [id] = @id;');

  return mapUser(result.recordset[0]);
}

async function findByDisplayName(displayName) {
  const pool = await getPool();
  const result = await pool.request()
    .input('displayName', sql.NVarChar(255), displayName)
    .query(`
      SELECT TOP (1) * 
      FROM [dbo].[Users] 
      WHERE [displayName] = @displayName;
    `);

  return result.recordset[0] || null;
}

async function createLocalUser({ displayName, passwordHash }) {
  const pool = await getPool();

  const existingUser = await findByDisplayName(displayName);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const result = await pool.request()
    .input('displayName', sql.NVarChar(255), displayName)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO [dbo].[Users] ([displayName], [passwordHash])
      OUTPUT inserted.*
      VALUES (@displayName, @passwordHash);
    `);

  return mapUser(result.recordset[0]);
}

module.exports = {
  findById,
  findByDisplayName,
  createLocalUser,
};