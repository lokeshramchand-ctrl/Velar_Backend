require('dotenv').config();
const Transaction = require('../models/Transaction');
const nlpService = require('../services/nlpService');
const connectDB = require('../config/db');
const { connectRabbit } = require('../config/rabbitmq');


async function startConsumers(channel) {
  console.log('Worker is now listening for queues.');

  // ---- VOICE ----
  await channel.consume('voice-transactions', async (msg) => {
    if (!msg) return;
    const { voiceInput, userId } = JSON.parse(msg.content.toString());
    try {
      const amountMatch = voiceInput.match(/(?:\₹|\$)?(\d+(?:\.\d{1,2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      if (amount === null) throw new Error('Could not extract amount');

      const cleaned = voiceInput
        .toLowerCase()
        .replace(/(bought|added|paid|spent|for|on)/g, '')
        .replace(/₹?\d+/, '')
        .trim();
      const description = cleaned
        ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        : 'Misc';

      let category = 'Other';
      try {
        category = await nlpService.predictCategory(description);
      } catch { }

      const newTxn = await Transaction.create({
        userId,
        description,
        amount,
        category,
        source: 'voice',
      });

      console.log('Voice transaction saved successfully:', newTxn._id);
      channel.ack(msg);
    } catch (err) {
      console.error('Voice transaction processing failed:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ---- MANUAL ----
  await channel.consume('manual-transactions', async (msg) => {
    if (!msg) return;
    const { description, amount, userId } = JSON.parse(msg.content.toString());
    try {
      let category = 'Other';
      try {
        category = await nlpService.predictCategory(description);
      } catch { }

      const newTxn = await Transaction.create({
        userId,
        description,
        amount,
        category,
        source: 'manual',
      });

      console.log('Manual transaction saved successfully:', newTxn._id);
      channel.ack(msg);
    } catch (err) {
      console.error('Manual transaction processing failed:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // ---- EMAIL ----
  await channel.consume('email-transactions', async (msg) => {
    if (!msg) return;
    const { userId, parsed, from } = JSON.parse(msg.content.toString());

    try {
      let category = 'Other';
      try {
        category = await nlpService.predictCategory(parsed.vendor || 'Unknown');
      } catch { }
      // ✅ Safe date parsing
      let dateValue = new Date();
      if (parsed.date) {
        // Try parsing dd-mm-yy (like 17-09-25)
        const match = parsed.date.match(/^(\d{2})-(\d{2})-(\d{2})$/);
        if (match) {
          const [_, day, month, year] = match;
          // Prefix 20 for yy → yyyy
          const isoDate = `20${year}-${month}-${day}`;
          const tempDate = new Date(isoDate);
          if (!isNaN(tempDate.getTime())) {
            dateValue = tempDate;
          } else {
            console.warn(`⚠️ Still invalid date after parse "${parsed.date}", defaulting to now`);
          }
        } else {
          const tempDate = new Date(parsed.date);
          if (!isNaN(tempDate.getTime())) {
            dateValue = tempDate;
          } else {
            console.warn(`⚠️ Invalid parsed date "${parsed.date}", defaulting to now`);
          }
        }
      }
      const txnData = {
        userId,
        description: parsed.vendor || 'Unknown Vendor',
        amount: parsed.amount,
        type: parsed.type || 'unknown',
        date: dateValue,
        vendor: parsed.vendor,
        category,
        source: 'email',
        bank: from,
        referenceNumber: parsed.referenceNumber,
      };

      let savedTxn;
      if (parsed.referenceNumber) {
        savedTxn = await Transaction.upsertByReferenceNumber(parsed.referenceNumber, txnData);
      } else {
        savedTxn = await Transaction.create(txnData);
      }
      console.log('Email transaction saved successfully:', savedTxn._id);
      channel.ack(msg);
    } catch (err) {
      console.error('Email transaction processing failed:', err.message);
      channel.nack(msg, false, false);
    }
  });
}

(
  async () => {
  try {
    await connectDB();

    const channel = await connectRabbit();
    await startConsumers(channel);

    // 💡 Handle reconnect by listening to channel/connection events
    channel.connection.on('close', async () => {
      console.error('🐇 RabbitMQ connection closed. Reconnecting worker...');
      setTimeout(async () => {
        const newChannel = await connectRabbit();
        await startConsumers(newChannel);
      }, 5000);
    });

    channel.connection.on('error', (err) => {
      console.error('🐇 RabbitMQ connection error:', err.message);
    });
  } catch (err) {
    console.error('❌ Worker failed:', err.message);
    process.exit(1);
  }
})();
