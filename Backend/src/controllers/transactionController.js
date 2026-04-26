const service = require("../services/transactionService");

exports.addTransaction = async (req, res) => {
  try {
    const { text, source } = req.body;

    if (!text) return res.status(400).json({ error: "Text required" });

    const txn = await service.createTransaction({ text, source });

    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.feedback = async (req, res) => {
  try {
    const { id, correctedCategory } = req.body;

    if (!id || !correctedCategory)
      return res.status(400).json({ error: "Invalid input" });

    const txn = await service.updateFeedback(id, correctedCategory);

    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await service.getTransactions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const data = await service.getRecent();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};