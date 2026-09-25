// Small checks every action runs on its input. Each failure is an ActionError
// with one plain sentence that names the field, what was wrong, and the valid
// values, so the agent can correct itself without asking the user.

export type Input = Record<string, unknown>;

export class ActionError extends Error {
  /** 400 for a bad argument, 404 for a row that does not exist, 500 for the rest. */
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ActionError";
    this.status = status;
  }
}

/** A row the action is about does not exist: a 404 that lists what does. */
export function notFound(kind: string, id: string, known: readonly string[]): ActionError {
  const list = known.length ? ` Known ${kind}s: ${listOf(known)}.` : ` There are no ${kind}s yet.`;
  return new ActionError(`No ${kind} '${id}'.${list}`, 404);
}

/** Valid values for a message; long lists are cut so the sentence stays short. */
export function listOf(values: readonly unknown[], max = 25): string {
  const shown = values.slice(0, max).map(String);
  const more = values.length - shown.length;
  return shown.join(", ") + (more > 0 ? `, … and ${more} more` : "");
}

/** Runs the checks on a nested item so its errors name the place: "steps[0]: who must be one of: …". */
export function within<T>(where: string, fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    if (err instanceof ActionError) throw new ActionError(`${where}: ${err.message}`, err.status);
    throw err;
  }
}

/** True when the key was passed at all (null counts as passed: it clears a field). */
export function present(input: Input, name: string): boolean {
  return input[name] !== undefined;
}

export function isObject(v: unknown): v is Input {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The input of an action must be one JSON object. */
export function asInput(v: unknown): Input {
  if (isObject(v)) return v;
  throw new ActionError(`The input must be a JSON object with the action's arguments, e.g. {"id": "acme-proposal"}, not ${kindOf(v)}.`);
}

function kindOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "a list";
  if (typeof v === "object") return "an object";
  if (typeof v === "number") return `the number ${v}`;
  if (typeof v === "boolean") return String(v);
  const s = String(v);
  return `'${s.length > 40 ? s.slice(0, 40) + "…" : s}'`;
}

// Numbers are accepted where text is expected (a label like 2026) because
// agents pass them; nothing else is coerced.
function asText(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

export function requiredString(input: Input, name: string, hint = "a short text"): string {
  const v = input[name];
  if (v === undefined || v === null || v === "") throw new ActionError(`${name} is required: ${hint}.`);
  const s = asText(v);
  if (s === undefined) throw new ActionError(`${name} must be text (${hint}), not ${kindOf(v)}.`);
  if (s === "") throw new ActionError(`${name} cannot be blank: ${hint}.`);
  return s;
}

/** undefined when omitted, null when passed as null or "" (which clears the field), else the trimmed text. */
export function optionalString(input: Input, name: string): string | null | undefined {
  const v = input[name];
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const s = asText(v);
  if (s === undefined) throw new ActionError(`${name} must be text, not ${kindOf(v)}.`);
  return s === "" ? null : s;
}

export function oneOf<T extends string>(input: Input, name: string, values: readonly T[], opts: { required?: boolean } = {}): T | undefined {
  const v = input[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ActionError(`${name} is required, one of: ${listOf(values)}.`);
    return undefined;
  }
  const s = asText(v);
  if (s !== undefined && (values as readonly string[]).includes(s)) return s as T;
  throw new ActionError(`${name} must be one of: ${listOf(values)} (got ${kindOf(v)}).`);
}

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/** An ISO 8601 date (2026-09-30) or timestamp (2026-09-30T14:00:00Z); null clears. */
export function isoDate(input: Input, name: string, opts: { required?: boolean } = {}): string | null | undefined {
  const v = input[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ActionError(`${name} is required: an ISO 8601 date like 2026-09-30 or 2026-09-30T14:00:00Z.`);
    return v === undefined ? undefined : null;
  }
  const s = typeof v === "string" ? v.trim() : "";
  if (!ISO.test(s) || Number.isNaN(Date.parse(s))) {
    throw new ActionError(`${name} must be an ISO 8601 date like 2026-09-30 or 2026-09-30T14:00:00Z (got ${kindOf(v)}).`);
  }
  return s;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function rangeWords(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return ` between ${min} and ${max}`;
  if (min !== undefined) return ` of at least ${min}`;
  if (max !== undefined) return ` of at most ${max}`;
  return "";
}

/** A whole number; numeric strings are fine (query strings). null clears. */
export function int(input: Input, name: string, opts: { required?: boolean; min?: number; max?: number } = {}): number | null | undefined {
  const v = input[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ActionError(`${name} is required: a whole number${rangeWords(opts.min, opts.max)}.`);
    return v === undefined ? undefined : null;
  }
  const n = asNumber(v);
  if (n === undefined || !Number.isInteger(n) || (opts.min !== undefined && n < opts.min) || (opts.max !== undefined && n > opts.max)) {
    throw new ActionError(`${name} must be a whole number${rangeWords(opts.min, opts.max)} (got ${kindOf(v)}).`);
  }
  return n;
}

/** A number, e.g. dollars as 1240 or 54.99. null clears. */
export function num(input: Input, name: string, opts: { required?: boolean; min?: number } = {}): number | null | undefined {
  const v = input[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ActionError(`${name} is required: a number${rangeWords(opts.min)}.`);
    return v === undefined ? undefined : null;
  }
  const n = asNumber(v);
  if (n === undefined || (opts.min !== undefined && n < opts.min)) {
    throw new ActionError(`${name} must be a number${rangeWords(opts.min)} (got ${kindOf(v)}).`);
  }
  return n;
}

const TRUE = ["true", "1", "yes"];
const FALSE = ["false", "0", "no"];

/** true/false; also 1/0 and "true"/"false" (query strings). Omitted or null → undefined. */
export function bool(input: Input, name: string, opts: { required?: boolean } = {}): boolean | undefined {
  const v = input[name];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ActionError(`${name} is required: true or false.`);
    return undefined;
  }
  if (typeof v === "boolean") return v;
  if (v === 1 || v === 0) return v === 1;
  if (typeof v === "string") {
    if (TRUE.includes(v.trim().toLowerCase())) return true;
    if (FALSE.includes(v.trim().toLowerCase())) return false;
  }
  throw new ActionError(`${name} must be true or false (got ${kindOf(v)}).`);
}

/** A list; a single item is accepted as a list of one; null → []. */
export function array(input: Input, name: string, opts: { required?: boolean } = {}): unknown[] | undefined {
  const v = input[name];
  if (v === undefined) {
    if (opts.required) throw new ActionError(`${name} is required: a list.`);
    return undefined;
  }
  if (v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/** A list of short texts; blanks are dropped. */
export function stringArray(input: Input, name: string, opts: { required?: boolean } = {}): string[] | undefined {
  const items = array(input, name, opts);
  if (items === undefined) return undefined;
  return items.map((item, i) => {
    const s = asText(item);
    if (s === undefined) throw new ActionError(`${name}[${i}] must be text, not ${kindOf(item)}; ${name} is a list of short texts.`);
    return s;
  }).filter((s) => s !== "");
}

/** A list of whole numbers (ids). */
export function intArray(input: Input, name: string, opts: { required?: boolean } = {}): number[] | undefined {
  const items = array(input, name, opts);
  if (items === undefined) return undefined;
  return items.map((item, i) => {
    const n = asNumber(item);
    if (n === undefined || !Number.isInteger(n)) throw new ActionError(`${name}[${i}] must be a whole number, not ${kindOf(item)}; ${name} is a list of ids.`);
    return n;
  });
}

/** A JSON object; a JSON-encoded string is unpacked, since agents sometimes double-encode. */
export function object(input: Input, name: string): Input | undefined {
  let v = input[name];
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      throw new ActionError(`${name} must be an object like {"due": "2026-09-30"}, not ${kindOf(input[name])}.`);
    }
  }
  if (isObject(v)) return v;
  throw new ActionError(`${name} must be an object like {"due": "2026-09-30"}, not ${kindOf(input[name])}.`);
}

/** A link the user can open: https://… (or http://), or a path inside the app. Never a file on the agent's computer. */
export function openableUrl(input: Input, name: string): string {
  const s = requiredString(input, name, "a link the user can open");
  const local = /^(file:|~|[a-zA-Z]:\\|\/(Users|home|tmp|var|private|root|workspace|mnt)\/)/i.test(s);
  const ok = /^(https?:\/\/\S+|\/[^/\s].*|#.*)$/.test(s);
  if (local || !ok) {
    throw new ActionError(`${name} must be a link the user can open, https://… or a path inside the app like /files/report.pdf, not a file on the agent's computer (got '${s.slice(0, 60)}').`);
  }
  return s;
}
