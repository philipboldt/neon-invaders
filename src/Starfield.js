import { CONSTANTS } from './constants.js';

export class Starfield {
  constructor(W, H, game) {
    this.W = W;
    this.H = H;
    this.game = game;
    this.layers = CONSTANTS.STAR_LAYERS.map(l => ({ ...l, stars: [] }));
    this.container = new PIXI.Container();
    this.game.fullScreenBgLayer.addChild(this.container);
    this.init();
  }

  init() {
    this.layers.forEach((layer, index) => {
      const opacity = CONSTANTS.STAR_ALPHA_BASE + (index * CONSTANTS.STAR_ALPHA_INC);
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

  update(dt = 1) {
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        star.y += layer.speed * this.game.heightFactor * dt;
        if (star.y > this.H) {
          star.y = -layer.size;
          star.x = Math.random() * this.W;
        }
        star.pixiObj.position.set(star.x, star.y);
      });
    });
  }
}
