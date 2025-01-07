import { TankBaseConfig } from '../../config/TankBaseConfig';

export class TankExhaust extends Phaser.GameObjects.Particles.ParticleEmitter {
  constructor(scene: Phaser.Scene, tank: Phaser.GameObjects.Image) {
    const direction = new Phaser.Math.Vector2(0, 0);
    direction.setToPolar(tank.rotation, 1);

    const dx = direction.x;
    const dy = direction.y;
    const ox = -dx * TankBaseConfig.width * 0.45;
    const oy = -dy * TankBaseConfig.width * 0.45;

    super(scene, 0, 0, 'tilesetTank', {
      frame: 'blackSmoke01',
      quantity: 1,
      speedX: { min: -10 * -dx, max: 10 * -dx },
      speedY: { min: 20 * -dy, max: 50 * -dy },
      scale: { min: 0.002, max: 0.2 },
      accelerationY: 1000 * -dy,
      accelerationX: 1000 * -dx,
      lifespan: { min: 100, max: 300 },
      alpha: { start: 0.5, end: 0, ease: 'Sine.easeIn' },
      rotate: { min: -180, max: 180 },
      angle: { min: 30, max: 110 },
      frequency: 15,
      follow: tank,
      blendMode: Phaser.BlendModes.NORMAL,
      followOffset: {
        x: ox,
        y: oy,
      },
    });
  }

  updateExhaust(direction: Phaser.Math.Vector2) {
    const dx = direction.x;
    const dy = direction.y;
    const ox = -dx * TankBaseConfig.width * 0.45;
    const oy = -dy * TankBaseConfig.width * 0.45;

    this.speedY = { min: 20 * -dy, max: 50 * -dy };
    this.speedX = { min: -10 * -dx, max: 10 * -dx };
    this.accelerationY = 1000 * -dy;
    this.accelerationX = 1000 * -dx;
    this.followOffset.x = ox;
    this.followOffset.y = oy;
  }
}
