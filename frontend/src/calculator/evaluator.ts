// Safe expression evaluator for the calculator.
// Supports: + - * / ( ) % decimals, scientific funcs (sin, cos, tan, log, ln, sqrt, exp), constants (pi, e), factorial (!), power (^).

const factorial = (n: number): number => {
  if (n < 0 || !Number.isFinite(n)) return NaN;
  if (n > 170) return Infinity;
  const k = Math.floor(n);
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
};

const sanitize = (raw: string): string => {
  let s = raw;

  // Convert factorial: 5! -> factorial(5), (expr)! -> factorial((expr))
  // Iterate while there are factorials
  while (/!/.test(s)) {
    s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/, "factorial($1)");
    // Safety break if pattern didn't reduce
    if (!/!/.test(s)) break;
    if (s.indexOf("!") !== -1 && !/(\d+(?:\.\d+)?|\([^()]*\))!/.test(s)) {
      throw new Error("Bad factorial");
    }
  }

  // Power operator
  s = s.replace(/\^/g, "**");

  // Percent: replace "X%" with "(X/100)"
  s = s.replace(/(\d+(?:\.\d+)?|\))%/g, "($1/100)");

  // Implicit multiplication for constants/funcs (e.g., 2pi, 3sin(...))
  // Replace constants
  s = s.replace(/\bpi\b/g, "Math.PI");
  s = s.replace(/\be\b/g, "Math.E");

  // Map function names
  s = s.replace(/\bsin\(/g, "Math.sin(");
  s = s.replace(/\bcos\(/g, "Math.cos(");
  s = s.replace(/\btan\(/g, "Math.tan(");
  s = s.replace(/\blog\(/g, "Math.log10(");
  s = s.replace(/\bln\(/g, "Math.log(");
  s = s.replace(/\bsqrt\(/g, "Math.sqrt(");
  s = s.replace(/\bexp\(/g, "Math.exp(");
  s = s.replace(/\babs\(/g, "Math.abs(");

  // Only allow these characters now
  if (!/^[\d+\-*/().,\s%MathPIEsincoatlgrqxpbf]*$/.test(s.replace(/factorial/g, ""))) {
    // permissive: but block clearly bad chars
  }
  if (/[a-zA-Z]/.test(s.replace(/Math\.(PI|E|sin|cos|tan|log10|log|sqrt|exp|abs)/g, "").replace(/factorial/g, ""))) {
    throw new Error("Invalid expression");
  }

  return s;
};

export const evaluateExpression = (expr: string): string => {
  if (!expr || !expr.trim()) return "";
  try {
    const sanitized = sanitize(expr);
    const fn = new Function("factorial", `"use strict"; return (${sanitized});`);
    const result = fn(factorial);
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return "Error";
    }
    // Round to 12 significant digits
    const rounded = Math.round(result * 1e12) / 1e12;
    return String(rounded);
  } catch {
    return "Error";
  }
};

// Convert digits between English and Bengali numerals
const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export const toBengali = (s: string): string =>
  s.replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
export const toEnglish = (s: string): string => {
  let out = s;
  BENGALI_DIGITS.forEach((bn, i) => {
    out = out.replace(new RegExp(bn, "g"), String(i));
  });
  return out;
};

export const displayNumber = (val: string, lang: "en" | "bn"): string => {
  return lang === "bn" ? toBengali(val) : val;
};
