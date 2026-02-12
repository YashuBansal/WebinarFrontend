// Shared helper to split a billing address into up to two
// roughly equal-length lines, preserving word boundaries.
// This logic was originally implemented in BillingHistory.jsx.

export const splitAddressIntoTwoLines = (rawAddress) => {
  if (!rawAddress || typeof rawAddress !== "string") return [];

  const normalized = rawAddress.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  // Short addresses stay on a single line
  if (normalized.length <= 40) {
    return [normalized];
  }

  const words = normalized.split(" ");
  const totalLength = normalized.length;
  const targetLength = totalLength / 2;

  let line1Words = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const extra = line1Words.length === 0 ? word.length : word.length + 1; // +1 for space

    if (currentLength + extra <= targetLength) {
      line1Words.push(word);
      currentLength += extra;
    } else {
      // Stop adding once we cross the half mark
      break;
    }
  }

  // If we couldn't add anything reasonably, fallback to simple split
  if (line1Words.length === 0) {
    const mid = Math.ceil(words.length / 2);
    return [
      words.slice(0, mid).join(" ").trim(),
      words.slice(mid).join(" ").trim(),
    ].filter(Boolean);
  }

  const line2Words = words.slice(line1Words.length);

  const lines = [
    line1Words.join(" ").trim(),
    line2Words.join(" ").trim(),
  ].filter(Boolean);

  // Ensure max two lines
  return lines.slice(0, 2);
};

