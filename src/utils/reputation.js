export const getReputation = (reputation) => {
  if (reputation === null) {
    return reputation;
  }

  if (isFloat(reputation)) {
    return Math.floor(reputation);
  }

  let _reputation = String(parseInt(reputation, 10));

  const neg = _reputation.charAt(0) === '-';
  _reputation = neg ? _reputation.substring(1) : _reputation;

  const str = _reputation;
  const leadingDigits = parseInt(str.substring(0, 4), 10);
  const log = Math.log(leadingDigits) / Math.log(10);
  const n = str.length - 1;
  let out = n + (log - parseInt(log, 10));

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(out)) {
    out = 0;
  }

  out = Math.max(out - 9, 0);
  out *= neg ? -1 : 1;
  out = out * 9 + 25;
  out = parseInt(out, 10);

  return out;
};

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}
