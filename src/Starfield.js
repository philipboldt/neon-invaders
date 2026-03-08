export class Starfield {
  constructor(W, H, game) {
    this.W = W;
    this.H = H;
    this.game = game;
    this.layers = [
      { size: 1, speed: 2.5, count: 50, stars: [] }, 
      { size: 2, speed: 1.2, count: 30, stars: [] },
      { size: 3, speed: 0.5, count: 15, stars: [] }  
    ];
    this.container = new PIXI.Container();
    this.game.bgLayer.addChild(this.container);
    this.init();
  }

  init() {
    this.layers.forEach((layer, index) => {
      const opacity = 0.2 + (index * 0.3);
      for (let i = 0; i < layer.count; i++) {
        const g = new PIXI.Graphics();
        g.beginFill(0xFFFFFF, opacity);
        g.drawRect(0, 0, layer.size, layer.size);
        g.endFill();
        this.container.addChild(g);

        const star = {
          x: Math.random() * this.W,
          y: Math.random() * this.H,
          pixiObj: g
        };
        star.pixiObj.position.set(star.x, star.y);
        layer.stars.push(star);
      }
    });
  }

  update() {
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        star.y += layer.speed * this.game.heightFactor;
        if (star.y > this.H) {
          star.y = -layer.size;
          star.x = Math.random() * this.W;
        }
        star.pixiObj.position.set(star.x, star.y);
      });
    });
  }
}
