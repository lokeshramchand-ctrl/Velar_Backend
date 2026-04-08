exports.parseBankMessage = (email) => {
  const result = {
    amount: null,
    vendor: null,
    rawVendor: null,
    type: null,
    date: null,
    referenceNumber: null,
  };

  // ---------- Amount ----------
  const amtMatch = email.match(/(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
  if (amtMatch) result.amount = parseFloat(amtMatch[1].replace(/,/g, ""));

  // ---------- Debit / Credit ----------
  if (/debited/i.test(email)) result.type = "debit";
  else if (/credited/i.test(email)) result.type = "credit";

  // ---------- Date ----------
  const dateMatch = email.match(/on\s+(\d{2}[-/]\d{2}[-/]\d{2,4})/i);
  if (dateMatch) result.date = dateMatch[1];

  // ---------- Reference Number ----------
  const refMatch = email.match(/(?:reference number is|UPI transaction reference number is|Ref No:?)\s*([A-Za-z0-9]+)/i);
  if (refMatch) result.referenceNumber = refMatch[1].trim();

  // ---------- Vendor Extraction ----------
  let vendorCandidate = null;

  // 1. Prefer "to VPA ..." pattern, stop at 'on|your|Ref|Txn' etc.
  const toMatch = email.match(/to\s+(?:VPA\s+)?(?:[^\s@]+\@[^\s]+\s+)?([A-Za-z0-9\s&.-]+)/i);
  if (toMatch) {
    vendorCandidate = toMatch[1]
      .split(/ on | your | ref | txn | transaction | number /i)[0]  // cut off junk
      .trim();
  }

  // 2. Fallback: fully uppercase phrases
  if (!vendorCandidate) {
    const upperMatch = email.match(/(?:\b[A-Z][A-Z0-9&.-]+\b(?:\s)?)+/g);
    if (upperMatch) vendorCandidate = upperMatch[0];
  }

  result.vendor = vendorCandidate;
  return result;
};