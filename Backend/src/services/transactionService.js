const Transaction = require("../models/Transaction");
const { predictCategory } = require("./nlpService");

const createTransaction = async ({ text, source }) => {
  const prediction = await predictCategory(text);

  const txn = new Transaction({
    text,
    amount: prediction.amount || null,
    merchant: prediction.merchant || null,
    predictedCategory: prediction.category || "Other",
    source
  });

  return await txn.save();
};

const updateFeedback = async (id, correctedCategory) => {
  const txn = await Transaction.findById(id);
  if (!txn) throw new Error("Transaction not found");

  txn.correctedCategory = correctedCategory;
  txn.isCorrected = true;

  return await txn.save();
};

const getTransactions = async () => {
  return await Transaction.find().sort({ createdAt: -1 });
};

const getRecent = async () => {
  return await Transaction.find().sort({ createdAt: -1 }).limit(5);
};

module.exports = {
  createTransaction,
  updateFeedback,
  getTransactions,
  getRecent
};