export class BaseView {
  constructor(game) {
    this.game = game;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.game.uiLayer.addChild(this.container);
  }

  show() {
    this.container.visible = true;
    this.container.alpha = 1;
  }

  hide() {
    this.container.visible = false;
  }

  updateLayout(W, H) {
    // To be overridden by subclasses
  }

  parseHexColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }
}
