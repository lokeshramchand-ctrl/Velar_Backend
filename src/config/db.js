const path = require('path');
const sql = require('mssql');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let poolPromise;
let schemaReadyPromise;

function getConfig() {
  const requiredEnvVars = [
    'MSSQL_USER',
    'MSSQL_PASSWORD',
    'MSSQL_SERVER',
    'MSSQL_DATABASE',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    port: process.env.MSSQL_PORT ? Number(process.env.MSSQL_PORT) : 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

async function initializeSchema(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[Users] (
        [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [googleId] NVARCHAR(255) NULL,
        [displayName] NVARCHAR(255) NULL,
        [email] NVARCHAR(255) NULL,
        [photo] NVARCHAR(1000) NULL,
        [passwordHash] NVARCHAR(255) NULL,
        [authProvider] NVARCHAR(50) NOT NULL DEFAULT 'google',
        [createdAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;

    IF EXISTS (
      SELECT 1
      FROM sys.columns
      WHERE object_id = OBJECT_ID(N'[dbo].[Users]')
        AND name = 'googleId'
        AND is_nullable = 0
    )
    BEGIN
      ALTER TABLE [dbo].[Users]
      ALTER COLUMN [googleId] NVARCHAR(255) NULL;
    END;

    DECLARE @usersGoogleConstraint NVARCHAR(128);
    SELECT @usersGoogleConstraint = kc.name
    FROM sys.key_constraints kc
    INNER JOIN sys.index_columns ic
      ON kc.parent_object_id = ic.object_id
      AND kc.unique_index_id = ic.index_id
    INNER JOIN sys.columns c
      ON ic.object_id = c.object_id
      AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'[dbo].[Users]')
      AND kc.[type] = 'UQ'
      AND c.name = 'googleId';

    IF @usersGoogleConstraint IS NOT NULL
    BEGIN
      EXEC('ALTER TABLE [dbo].[Users] DROP CONSTRAINT [' + @usersGoogleConstraint + ']');
    END;

    IF COL_LENGTH('dbo.Users', 'passwordHash') IS NULL
    BEGIN
      ALTER TABLE [dbo].[Users]
      ADD [passwordHash] NVARCHAR(255) NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'authProvider') IS NULL
    BEGIN
      ALTER TABLE [dbo].[Users]
      ADD [authProvider] NVARCHAR(50) NOT NULL
        CONSTRAINT [DF_Users_AuthProvider] DEFAULT 'google';
    END;

    IF EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UQ__Users__googleId'
        AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
      DROP INDEX [UQ__Users__googleId] ON [dbo].[Users];
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_Users_GoogleId'
        AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
      CREATE UNIQUE INDEX [UX_Users_GoogleId]
      ON [dbo].[Users]([googleId])
      WHERE [googleId] IS NOT NULL;
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_Users_Email'
        AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
      CREATE UNIQUE INDEX [UX_Users_Email]
      ON [dbo].[Users]([email])
      WHERE [email] IS NOT NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Transactions]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[Transactions] (
        [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [userId] UNIQUEIDENTIFIER NOT NULL,
        [amount] DECIMAL(18, 2) NOT NULL,
        [category] NVARCHAR(255) NOT NULL DEFAULT 'Other',
        [date] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [source] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [type] NVARCHAR(50) NOT NULL DEFAULT 'unknown',
        [vendor] NVARCHAR(255) NULL,
        [referenceNumber] NVARCHAR(255) NULL,
        [metadata] NVARCHAR(MAX) NULL,
        [bank] NVARCHAR(255) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [FK_Transactions_Users] FOREIGN KEY ([userId]) REFERENCES [dbo].[Users]([id])
      );
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_Transactions_ReferenceNumber'
        AND object_id = OBJECT_ID(N'[dbo].[Transactions]')
    )
    BEGIN
      CREATE UNIQUE INDEX [UX_Transactions_ReferenceNumber]
      ON [dbo].[Transactions]([referenceNumber])
      WHERE [referenceNumber] IS NOT NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ArchivedTransactions]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[ArchivedTransactions] (
        [id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [userId] UNIQUEIDENTIFIER NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [amount] DECIMAL(18, 2) NOT NULL,
        [category] NVARCHAR(255) NULL,
        [date] DATETIME2 NOT NULL,
        [type] NVARCHAR(50) NULL,
        [vendor] NVARCHAR(255) NULL,
        [source] NVARCHAR(50) NULL,
        [referenceNumber] NVARCHAR(255) NULL,
        [metadata] NVARCHAR(MAX) NULL,
        [bank] NVARCHAR(255) NULL,
        [createdAt] DATETIME2 NOT NULL,
        [updatedAt] DATETIME2 NOT NULL,
        [archivedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_ArchivedTransactions_ReferenceNumber'
        AND object_id = OBJECT_ID(N'[dbo].[ArchivedTransactions]')
    )
    BEGIN
      CREATE UNIQUE INDEX [UX_ArchivedTransactions_ReferenceNumber]
      ON [dbo].[ArchivedTransactions]([referenceNumber])
      WHERE [referenceNumber] IS NOT NULL;
    END;
  `);
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(getConfig());
  }

  const pool = await poolPromise;

  if (!schemaReadyPromise) {
    schemaReadyPromise = initializeSchema(pool);
  }

  await schemaReadyPromise;
  return pool;
}

async function connectDB() {
  try {
    const pool = await getPool();
    console.log('MSSQL connected successfully');
    return pool;
  } catch (err) {
    console.error('MSSQL connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
module.exports.connect = connectDB;
module.exports.getPool = getPool;
module.exports.sql = sql;
