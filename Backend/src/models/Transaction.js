const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    amount: Number,
    merchant: String,

    predictedCategory: String,
    correctedCategory: { type: String, default: null },

    isCorrected: { type: Boolean, default: false },

    source: {
      type: String,
      enum: ["manual", "voice"],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);