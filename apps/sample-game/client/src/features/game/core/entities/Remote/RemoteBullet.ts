import { BulletConfig } from '../../config/BulletConfig';
import { TankTurretConfig } from '../../config/TankTurretConfig';

export class RemoteBullet extends Phaser.GameObjects.Image {
  private _playerLayer: Phaser.GameObjects.Layer;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    r: number,
    playerLayer: Phaser.GameObjects.Layer
  ) {
    super(scene, x, y, 'tilesetTank', 'sniper-shell');
    this.width = BulletConfig.width;
    this.height = BulletConfig.height;
    this.rotation = r;
    this.scale = 0.5;
    this._playerLayer = playerLayer;
    this._playerLayer.add(this);
  }

  updateBullet(x: number, y: number, r: number) {
    this.setRotation(r);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 50,
      ease: 'Power2',
    });
  }

  public fire(x: number, y: number, r: number) {
    const direction = new Phaser.Math.Vector2(x, y);
    direction.setToPolar(r, 1);
    const dx = direction.x;
    const dy = direction.y;

    const ox = x + dx * TankTurretConfig.width;
    const oy = y + dy * TankTurretConfig.width;

    this.setPosition(ox, oy);
    this.setRotation(r);
    this.setVisible(true);
    this.scene.add
      .particles(ox, oy, 'tilesetTank', {
        frame: 'blackSmoke01',
        quantity: 5,
        speedX: dx * 100,
        speedY: dy * 100,
        accelerationX: dx * 500,
        accelerationY: { min: dy * -100, max: dy * 100 },
        scale: 0.2,
        lifespan: { min: 300, max: 500 },
        rotate: { min: -180, max: 180 },
        angle: { min: -10, max: 10 },
        frequency: 75,
        blendMode: Phaser.BlendModes.ADD,
        maxParticles: 5,
        color: [
          0x040d61, 0xfacc22, 0xf89800, 0xf83600, 0x9f0404, 0x4b4a4f, 0x353438,
          0x040404,
        ],
      })
      .setDepth(this._playerLayer.depth);
  }

  public explode() {
    this.scene.add
      .particles(this.x, this.y, 'tilesetTank', {
        frame: 'blackSmoke01',
        quantity: 5,
        speedX: 100,
        speedY: 100,
        accelerationX: 500,
        accelerationY: { min: -100, max: 100 },
        scale: 0.5,
        lifespan: { min: 500, max: 1000 },
        rotate: { min: -180, max: 180 },
        angle: { min: -10, max: 10 },
        frequency: 75,
        blendMode: Phaser.BlendModes.ADD,
        maxParticles: 5,
        color: [
          0x040d61, 0xfacc22, 0xf89800, 0xf83600, 0x9f0404, 0x4b4a4f, 0x353438,
          0x040404,
        ],
      })
      .setDepth(this._playerLayer.depth);
    this.setVisible(false);
  }
}
