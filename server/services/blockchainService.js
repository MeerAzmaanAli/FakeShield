const contract = require('../config/blockchain');

const logReport = async (report) => {
  try {
    // ── Step 1: Send transaction to smart contract ─────────────────────
    const tx = await contract.logReport(
      report.profileURL,   // string
      report.platform,     // string  e.g. "instagram"
      report.aiVerdict     // string  e.g. "fake" or "suspicious"
    );

    // ── Step 2: Wait for it to be mined ───────────────────────────────
    const receipt = await tx.wait();

    console.log('Blockchain tx confirmed:', receipt.hash);

    // ── Step 3: Return the transaction hash ───────────────────────────
    return receipt.hash;

  } catch (error) {
    console.error('Blockchain logReport failed:', error.message);
    throw error;  // let agencyController handle it
  }
};

module.exports = { logReport };