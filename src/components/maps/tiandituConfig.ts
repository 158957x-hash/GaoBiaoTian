const tiandituTk = import.meta.env.VITE_TIANDITU_TK?.trim();

export function getTiandituTk() {
  return tiandituTk;
}

export function hasTiandituTk() {
  return Boolean(tiandituTk);
}
