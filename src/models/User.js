const { getPool, sql } = require('../config/db');
const { mapUser } = require('./_serializers');

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT * FROM [dbo].[Users] WHERE [id] = @id;');

  return mapUser(result.recordset[0]);
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(255), email)
    .query('SELECT TOP (1) * FROM [dbo].[Users] WHERE [email] = @email;');

  return result.recordset[0] || null;
}

async function createLocalUser({ displayName, email, passwordHash }) {
  const pool = await getPool();
  const existingUser = await findByEmail(email);

  if (existingUser) {
    if (existingUser.passwordHash) {
      throw new Error('User already exists with local authentication');
    }

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, existingUser.id)
      .input('displayName', sql.NVarChar(255), displayName || existingUser.displayName || null)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query(`
        UPDATE [dbo].[Users]
        SET
          [displayName] = @displayName,
          [passwordHash] = @passwordHash,
          [authProvider] = CASE WHEN [googleId] IS NOT NULL THEN 'both' ELSE 'local' END
        OUTPUT inserted.*
        WHERE [id] = @id;
      `);

    return mapUser(result.recordset[0]);
  }

  const result = await pool.request()
    .input('displayName', sql.NVarChar(255), displayName || null)
    .input('email', sql.NVarChar(255), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      INSERT INTO [dbo].[Users] ([displayName], [email], [passwordHash], [authProvider])
      OUTPUT inserted.*
      VALUES (@displayName, @email, @passwordHash, 'local');
    `);

  return mapUser(result.recordset[0]);
}

module.exports = {
  findById,
  findByEmail,
  createLocalUser,
};
