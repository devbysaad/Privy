type Fields = Record<string, unknown>;

function line(level: string, msg: string, fields?: Fields) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "privy",
    ...fields,
  };
  const text = JSON.stringify(payload);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.info(text);
}

/** Structured logs — one JSON object per line for production aggregators. */
export const log = {
  info: (msg: string, fields?: Fields) => line("info", msg, fields),
  warn: (msg: string, fields?: Fields) => line("warn", msg, fields),
  error: (msg: string, fields?: Fields) => line("error", msg, fields),
};
