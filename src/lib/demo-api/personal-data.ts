// Port of prototipe/api/app/personal_data.py (QA-P01 D1, HR-7): public free text with a phone number or an email is
// refused, not masked. Same heuristic, same formats; it must not trip on years, street numbers, dates or coordinates.

const EMAIL = /[\p{L}\p{N}_.+\-]+@[\p{L}\p{N}_\-]+(?:\.[\p{L}\p{N}_\-]+)+/u;
const AT = /\s*[[({]\s*(?:at|собака)\s*[\])}]\s*/giu;
const DOT = /\s*[[({]\s*(?:dot|точка)\s*[\])}]\s*/giu;

// Digit groups joined by spaces, hyphens, brackets or slashes: "+996 (555) 12-34-56".
const CANDIDATE = /\+?[(]?\p{Nd}[\p{Nd} \t \-–—()/]*/gu;
// Dot-separated groups: "0555.123.456" (but not a date, which has fewer digits).
const DOTTED = /\+?\p{Nd}{1,4}(?:\.\p{Nd}{2,4}){2,}/gu;

const MAX_PHONE_DIGITS = 15;

function normalise(text: string): string {
  // NFKC folds full-width digits and "＋"; zero-width and other format characters used to split a number are dropped.
  return text.normalize("NFKC").replace(/\p{Cf}/gu, "");
}

/** Decimal value of a Unicode digit (Python `unicodedata.digit`): Nd runs are blocks of ten starting at zero. */
function digitValue(char: string): number {
  const code = char.codePointAt(0) as number;
  if (code >= 48 && code <= 57) return code - 48;
  let start = code;
  while (start > 0 && /^\p{Nd}$/u.test(String.fromCodePoint(start - 1))) start -= 1;
  return (code - start) % 10;
}

function asciiDigits(chars: string): string {
  let out = "";
  for (const char of chars) if (/^\p{Nd}$/u.test(char)) out += String(digitValue(char));
  return out;
}

function isPhone(groups: string[], plus: boolean): boolean {
  const digits = groups.join("");
  const count = digits.length;
  if (count > MAX_PHONE_DIGITS) return false;
  if (plus) return count >= 9;
  if (count === 12 && digits.startsWith("996")) return true;
  if (count === 10 && digits[0] === "0") return true; // 0555 123 456, 0312 12-34-56, 0 555 123456
  if (count === 11 && "78".includes(digits[0])) return true; // 8 (312) 123-456, 7 999 123 45 67
  if (count === 9 && "2357".includes(digits[0])) return groups.length === 1 || groups[0].length === 3; // 555 123 456
  return false;
}

function groupsContainPhone(groups: string[], plus: boolean): boolean {
  for (let start = 0; start < groups.length; start += 1) {
    for (let end = start + 1; end <= groups.length; end += 1) {
      const window = groups.slice(start, end);
      if (window.join("").length > MAX_PHONE_DIGITS) break;
      if (isPhone(window, plus && start === 0)) return true;
    }
  }
  return false;
}

export function containsEmail(text: string): boolean {
  const folded = normalise(text).replace(AT, "@").replace(DOT, ".");
  return EMAIL.test(folded);
}

export function containsPhone(text: string): boolean {
  const folded = normalise(text);
  for (const match of folded.matchAll(CANDIDATE)) {
    const groups = (match[0].match(/\p{Nd}+/gu) ?? []).map(asciiDigits);
    if (groupsContainPhone(groups, match[0].startsWith("+"))) return true;
  }
  for (const match of folded.matchAll(DOTTED)) {
    const groups = match[0].replace(/^\++/, "").split(".").map(asciiDigits);
    if (groupsContainPhone(groups, match[0].startsWith("+"))) return true;
  }
  return false;
}

export function containsPersonalData(text: string | null | undefined): boolean {
  if (!text) return false;
  return containsEmail(text) || containsPhone(text);
}
