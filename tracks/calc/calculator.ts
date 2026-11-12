/**
 * The calculate tool's evaluator, without eval: numbers with a decimal point, + − × ÷, parentheses,
 * ^ or ** powers, sqrt, abs, min, max, floor, ceil, round(x, digits) half away from zero, and pi.
 */
type Token = { kind: "number"; value: number } | { kind: "name"; value: string } | { kind: "op"; value: string };

/** Rounds half away from zero to `digits` decimals, as commercial rounding does. */
export const roundHalfUp = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return (Math.sign(value) * Math.round(Math.abs(value) * factor * (1 + Number.EPSILON))) / factor;
};

const ALIASES: Record<string, string> = { "×": "*", "·": "*", "÷": "/", "−": "-", "–": "-" };

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;
  while (index < text.length) {
    const rest = text.slice(index);
    const space = /^\s+/u.exec(rest);
    const number = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/iu.exec(rest);
    const name = /^[a-zπ_]+/iu.exec(rest);
    if (space) index += space[0].length;
    else if (number) {
      tokens.push({ kind: "number", value: Number(number[0]) });
      index += number[0].length;
    } else if (name) {
      tokens.push({ kind: "name", value: name[0].toLowerCase() });
      index += name[0].length;
    } else if (rest.startsWith("**")) {
      tokens.push({ kind: "op", value: "^" });
      index += 2;
    } else {
      const op = ALIASES[rest[0]!] ?? rest[0]!;
      if (!"+-*/^(),".includes(op)) throw new Error(`Unexpected character "${rest[0]}" at position ${index + 1}.`);
      tokens.push({ kind: "op", value: op });
      index += 1;
    }
  }
  return tokens;
};

const FUNCTIONS: Record<string, { arity: [number, number]; apply: (args: number[]) => number }> = {
  sqrt: {
    arity: [1, 1],
    apply: ([x]) => {
      if (x! < 0) throw new Error("sqrt of a negative number.");
      return Math.sqrt(x!);
    },
  },
  abs: { arity: [1, 1], apply: ([x]) => Math.abs(x!) },
  floor: { arity: [1, 1], apply: ([x]) => Math.floor(x!) },
  ceil: { arity: [1, 1], apply: ([x]) => Math.ceil(x!) },
  round: { arity: [1, 2], apply: ([x, digits]) => roundHalfUp(x!, digits ?? 0) },
  min: { arity: [1, Infinity], apply: (args) => Math.min(...args) },
  max: { arity: [1, Infinity], apply: (args) => Math.max(...args) },
};
const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI };

/** Evaluates an arithmetic expression; throws an Error that says what is wrong with it. */
export const evaluate = (expression: string): number => {
  const tokens = tokenize(expression);
  let position = 0;
  const peek = () => tokens[position];
  const isOp = (value: string) => peek()?.kind === "op" && peek()!.value === value;
  const expect = (value: string) => {
    if (!isOp(value)) throw new Error(`Expected "${value}".`);
    position++;
  };

  const sum = (): number => {
    let value = product();
    while (isOp("+") || isOp("-")) value = tokens[position++]!.value === "+" ? value + product() : value - product();
    return value;
  };
  const product = (): number => {
    let value = unary();
    while (isOp("*") || isOp("/")) {
      const op = tokens[position++]!.value;
      const right = unary();
      if (op === "/" && right === 0) throw new Error("Division by zero.");
      value = op === "*" ? value * right : value / right;
    }
    return value;
  };
  const unary = (): number => {
    if (isOp("-")) {
      position++;
      return -unary();
    }
    if (isOp("+")) {
      position++;
      return unary();
    }
    return power();
  };
  const power = (): number => {
    const base = primary();
    if (!isOp("^")) return base;
    position++;
    return base ** unary();
  };
  const primary = (): number => {
    const token = tokens[position++];
    if (!token) throw new Error("Unexpected end of expression.");
    if (token.kind === "number") return token.value;
    if (token.kind === "op") {
      if (token.value !== "(") throw new Error(`Unexpected "${token.value}".`);
      const value = sum();
      expect(")");
      return value;
    }
    if (token.value in CONSTANTS) return CONSTANTS[token.value]!;
    const fn = FUNCTIONS[token.value];
    if (!fn) throw new Error(`Unknown name "${token.value}". Functions: ${Object.keys(FUNCTIONS).join(", ")}; constant: pi.`);
    expect("(");
    const args = [sum()];
    while (isOp(",")) {
      position++;
      args.push(sum());
    }
    expect(")");
    if (args.length < fn.arity[0] || args.length > fn.arity[1]) throw new Error(`Wrong number of arguments for ${token.value}.`);
    return fn.apply(args);
  };

  if (!tokens.length) throw new Error("Empty expression.");
  const value = sum();
  if (position < tokens.length) throw new Error(`Unexpected "${String(tokens[position]!.value)}" at token ${position + 1}.`);
  if (!Number.isFinite(value)) throw new Error("The result is not a finite number.");
  return Number(value.toPrecision(12));
};
