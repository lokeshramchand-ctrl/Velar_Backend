function parseJson(value) {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function serializeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  return JSON.stringify(metadata);
}

function mapUser(row) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    googleId: row.googleId,
    displayName: row.displayName,
    email: row.email,
    photo: row.photo,
    authProvider: row.authProvider,
    createdAt: row.createdAt,
  };
}

function mapTransaction(row) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    userId: row.userId,
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    source: row.source,
    description: row.description,
    type: row.type,
    vendor: row.vendor,
    referenceNumber: row.referenceNumber,
    metadata: parseJson(row.metadata),
    bank: row.bank,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

module.exports = {
  mapUser,
  mapTransaction,
  serializeMetadata,
};
