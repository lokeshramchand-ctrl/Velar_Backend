const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/₹|\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

module.exports = normalizeText;