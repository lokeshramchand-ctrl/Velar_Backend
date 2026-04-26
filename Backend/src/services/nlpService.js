const axios = require("axios");

const predictCategory = async (text) => {
  try {
    const res = await axios.post(process.env.PREDICT_API_URL, {
      description: text
    });

    return res.data;
  } catch (err) {
    console.error("NLP Error:", err.message);
    return { category: "Other" };
  }
};

module.exports = { predictCategory };