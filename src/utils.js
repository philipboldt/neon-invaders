export function drawRect(ctx, x, y, w, h, fill, glow) {
  if (glow) {
    ctx.shadowColor = fill;
    ctx.shadowBlur = 15;
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
}
