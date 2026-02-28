export class Starfield {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.layers = [
      { size: 1, speed: 0.5, count: 50, stars: [] },
      { size: 2, speed: 1.2, count: 30, stars: [] },
      { size: 3, speed: 2.5, count: 15, stars: [] }
    ];
    this.init();
  }

  init() {
    this.layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        layer.stars.push({
          x: Math.random() * this.W,
          y: Math.random() * this.H
        });
      }
    });
  }

  update() {
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        star.y += layer.speed;
        if (star.y > this.H) {
          star.y = -layer.size;
          star.x = Math.random() * this.W;
        }
      });
    });
  }

  draw(ctx) {
    this.layers.forEach((layer, index) => {
      const opacity = 0.3 + (index * 0.3);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      layer.stars.forEach(star => {
        ctx.fillRect(star.x, star.y, layer.size, layer.size);
      });
    });
  }
}
