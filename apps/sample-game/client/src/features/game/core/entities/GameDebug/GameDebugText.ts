export class GameDebugText extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '', {
      color: '#ffff00',
    });
    this.setOrigin(0.5, 0).setScrollFactor(0, 0);
  }

  updateDebugText(time: number, delta: number) {
    this.setText([
      `Title: ${this.scene.game.config.gameTitle}`,
      `Version: ${this.scene.game.config.gameVersion}`,
      `URL: ${this.scene.game.config.gameURL}`,
      `FPS: ${this.scene.game.loop.actualFps.toFixed()}`,
      `Time: ${time.toFixed()}, Delta: ${delta.toFixed()}`,
    ]);
  }
}
