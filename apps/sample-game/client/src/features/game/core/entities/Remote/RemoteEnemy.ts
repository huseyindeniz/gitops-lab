import log from 'loglevel';

import { TankBaseConfig } from '../../config/TankBaseConfig';
import { TankTurretConfig } from '../../config/TankTurretConfig';
import { TankExhaust } from '../Shared/TankExhaust';

import { RemoteBullet } from './RemoteBullet';
import { BulletStatus } from './RemoteBulletStatus';
import { RemotePlayerInfo } from './RemotePlayerInfo';
import { RemotePlayerState } from './RemotePlayerState';

export class RemoteEnemy {
  private _playerId: string;
  private _scene: Phaser.Scene;
  private _isActive: boolean = false;
  private _fuel: number = 0;
  private _playerLayer: Phaser.GameObjects.Layer;
  private _uiLayer: Phaser.GameObjects.Layer;
  private _tankBody: Phaser.GameObjects.Image;
  private _tankTurret: Phaser.GameObjects.Image;
  private _tankExhaust: TankExhaust;
  private _playerInfo: RemotePlayerInfo;
  private _bullet: RemoteBullet;
  private _previousBulletStatus: BulletStatus = BulletStatus.IDLE;
  private _serverState: RemotePlayerState;

  constructor(
    scene: Phaser.Scene,
    playerLayer: Phaser.GameObjects.Layer,
    uiLayer: Phaser.GameObjects.Layer,
    state: RemotePlayerState
  ) {
    this._scene = scene;
    this._playerId = state.playerId;
    this._serverState = { ...state };
    this._isActive = state.isOn;
    this._fuel = state.fuel;
    this._playerLayer = playerLayer;
    this._uiLayer = uiLayer;
    this._tankBody = scene.add.image(
      state.x,
      state.x,
      'tilesetTank',
      TankBaseConfig.name
    );
    this._tankTurret = scene.add.image(
      state.x,
      state.y,
      'tilesetTank',
      TankTurretConfig.name
    );

    this._tankExhaust = new TankExhaust(scene, this._tankBody);
    this._tankExhaust.stop();
    this._playerInfo = new RemotePlayerInfo(
      scene,
      10,
      10,
      this._playerId,
      this._fuel
    );

    // create the bullet
    this._bullet = new RemoteBullet(
      this._scene,
      this._tankTurret.x,
      this._tankTurret.y,
      this._tankTurret.rotation,
      this._playerLayer
    );
    this._bullet.setVisible(false);

    // add objects to layers
    this._uiLayer.add([this._playerInfo]);
    this._playerLayer.add([
      this._tankBody,
      this._tankTurret,
      this._tankExhaust,
      this._bullet,
    ]);
  }

  setServerState(serverState: RemotePlayerState) {
    this._previousBulletStatus = this._serverState.bulletStatus;
    this._serverState = { ...serverState };
  }

  updateEnemy(_time: number, _delta: number) {
    if (this._isActive !== this._serverState.isOn) {
      this._isActive = this._serverState.isOn;
      if (this._isActive) {
        this._tankExhaust.start();
      } else {
        this._tankExhaust.stop();
      }
    }
    this._fuel = this._serverState.fuel;

    this._scene.tweens.add({
      targets: [this._tankBody, this._tankTurret],
      x: this._serverState.x,
      y: this._serverState.y,
      duration: 200,
      ease: 'Power2',
    });
    this._tankBody.rotation = this._serverState.r;
    this._tankTurret.rotation = this._serverState.turretR;

    if (this._uiLayer?.visible) {
      // update HUD items
      this._playerInfo.updateRemotePlayerInfo(
        this._tankBody.x,
        this._tankBody.y,
        this._fuel
      );
      // update score
      // update turns
    }
    if (this._isActive) {
      const direction = new Phaser.Math.Vector2(0, 0);
      direction.setToPolar(this._tankBody.rotation, 1);
      this._tankExhaust.updateExhaust(direction);
    }

    this._updateBullet();
  }

  public explode() {
    this._isActive = false;
    this._scene.add
      .particles(this._tankBody.x, this._tankBody.y, 'tilesetTank', {
        frame: 'blackSmoke01',
        quantity: 5,
        speedX: 100,
        speedY: 100,
        accelerationX: 500,
        accelerationY: { min: -100, max: 100 },
        scale: 1,
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
      .setDepth(20);
    this._tankBody.destroy();
    this._tankTurret.destroy();
    this._tankExhaust.destroy();
    this._playerInfo.destroy();
  }

  private _updateBullet() {
    // log.debug(this._serverState.bulletStatus, this._previousBulletStatus);
    switch (this._serverState.bulletStatus) {
      case BulletStatus.IDLE:
        // hide bullet
        this._bullet.setVisible(false);
        break;
      case BulletStatus.FIRED:
        // show animation + play sound (only once)
        if (this._previousBulletStatus === BulletStatus.IDLE) {
          log.debug('REMOTE FIRED');
          this._bullet.fire(
            this._serverState.x,
            this._serverState.y,
            this._serverState.turretR
          );
        }
        log.debug('REMOTE MOVING');
        // update position
        this._bullet.updateBullet(
          this._serverState.bulletX,
          this._serverState.bulletY,
          this._serverState.bulletR
        );
        break;
      case BulletStatus.EXPLODED:
        log.debug('REMOTE EXPLODED');
        // show explosion animation and hide
        this._bullet.explode();
        break;
      default:
        // hide bullet
        this._bullet.setVisible(false);
        break;
    }
  }
}
