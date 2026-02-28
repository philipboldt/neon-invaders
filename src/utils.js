export function drawRect(ctx, x, y, w, h, fill, glow) {
  if (glow) {
    ctx.shadowColor = fill;
    ctx.shadowBlur = 15;
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
}

export function darkenColor(hex, ratio) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * ratio));
  const g = Math.max(0, Math.floor(((n >> 8) & 0xff) * ratio));
  const b = Math.max(0, Math.floor((n & 0xff) * ratio));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}
