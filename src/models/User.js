const { getPool, sql } = require('../config/db');
const { mapUser } = require('./_serializers');

async function upsertGoogleUser({ googleId, displayName, email, photo }) {
  const pool = await getPool();
  const existingByGoogleId = await pool.request()
    .input('googleId', sql.NVarChar(255), googleId)
    .query('SELECT TOP (1) * FROM [dbo].[Users] WHERE [googleId] = @googleId;');

  if (existingByGoogleId.recordset[0]) {
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, existingByGoogleId.recordset[0].id)
      .input('displayName', sql.NVarChar(255), displayName || null)
      .input('email', sql.NVarChar(255), email || null)
      .input('photo', sql.NVarChar(1000), photo || null)
      .query(`
        UPDATE [dbo].[Users]
        SET
          [displayName] = @displayName,
          [email] = @email,
          [photo] = @photo,
          [authProvider] = CASE WHEN [passwordHash] IS NOT NULL THEN 'both' ELSE 'google' END
        OUTPUT inserted.*
        WHERE [id] = @id;
      `);

    return mapUser(result.recordset[0]);
  }

  if (email) {
    const existingByEmail = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT TOP (1) * FROM [dbo].[Users] WHERE [email] = @email;');

    if (existingByEmail.recordset[0]) {
      const result = await pool.request()
        .input('id', sql.UniqueIdentifier, existingByEmail.recordset[0].id)
        .input('googleId', sql.NVarChar(255), googleId)
        .input('displayName', sql.NVarChar(255), displayName || null)
        .input('email', sql.NVarChar(255), email || null)
        .input('photo', sql.NVarChar(1000), photo || null)
        .query(`
          UPDATE [dbo].[Users]
          SET
            [googleId] = @googleId,
            [displayName] = @displayName,
            [email] = @email,
            [photo] = @photo,
            [authProvider] = CASE WHEN [passwordHash] IS NOT NULL THEN 'both' ELSE 'google' END
          OUTPUT inserted.*
          WHERE [id] = @id;
        `);

      return mapUser(result.recordset[0]);
    }
  }

  const result = await pool.request()
    .input('googleId', sql.NVarChar(255), googleId)
    .input('displayName', sql.NVarChar(255), displayName || null)
    .input('email', sql.NVarChar(255), email || null)
    .input('photo', sql.NVarChar(1000), photo || null)
    .query(`
      INSERT INTO [dbo].[Users] ([googleId], [displayName], [email], [photo], [authProvider])
      OUTPUT inserted.*
      VALUES (@googleId, @displayName, @email, @photo, 'google');
    `);

  return mapUser(result.recordset[0]);
}

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
  upsertGoogleUser,
  findById,
  findByEmail,
  createLocalUser,
};
