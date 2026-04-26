const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description required' });
    }

    const response = await axios.post(process.env.PREDICT_API_URL, {
      description
    });

    return res.json(response.data);

  } catch (error) {
    console.error("Prediction error:", error.message);
    return res.status(500).json({ error: 'Prediction failed' });
  }
});

module.exports = router;