const { getPool } = require('../config/db');

class RefreshToken {
  static async create({ userId, token, expiresAt }) {
    const pool = await getPool();
    await pool.request()
      .input('userId', userId)
      .input('token', token)
      .input('expiresAt', new Date(expiresAt))
      .query(`
        INSERT INTO RefreshTokens (userId, token, expiresAt)
        VALUES (@userId, @token, @expiresAt)
      `);
  }

  static async find(token) {
    const pool = await getPool();
    const result = await pool.request()
      .input('token', token)
      .query(`
        SELECT * FROM RefreshTokens WHERE token = @token
      `);

    return result.recordset[0];
  }

  static async delete(token) {
    const pool = await getPool();
    await pool.request()
      .input('token', token)
      .query(`DELETE FROM RefreshTokens WHERE token = @token`);
  }
}

module.exports = RefreshToken;