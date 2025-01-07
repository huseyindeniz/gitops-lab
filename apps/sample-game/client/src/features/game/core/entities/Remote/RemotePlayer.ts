import { Room } from 'colyseus.js';
import log from 'loglevel';

import { TankBaseConfig } from '../../config/TankBaseConfig';
import { TankTurretConfig } from '../../config/TankTurretConfig';
import { GameControl } from '../Shared/GameControl';
import { TankExhaust } from '../Shared/TankExhaust';
import { TankHUD } from '../Shared/TankHUD';
import { TankSounds } from '../Shared/TankSounds';

import { RemoteBullet } from './RemoteBullet';
import { BulletStatus } from './RemoteBulletStatus';
import {
  PlayerActions,
  PlayerCommand,
  PlayerCommands,
} from './RemotePlayerCommands';
import { RemotePlayerInfo } from './RemotePlayerInfo';
import { RemotePlayerState } from './RemotePlayerState';

export class RemotePlayer {
  private _scene: Phaser.Scene;
  private _playerId: string;
  private _connectedRoom: Room;
  private _isActive: boolean = false;
  private _isReadyToFire: boolean = false;
  private _fuel: number = 0;
  private _playerLayer: Phaser.GameObjects.Layer;
  private _uiLayer: Phaser.GameObjects.Layer;
  private _tankBody: Phaser.GameObjects.Image;
  private _tankTurret: Phaser.GameObjects.Image;
  private _tankExhaust: TankExhaust;
  private _tankHUD: TankHUD;
  private _tankTarget: Phaser.GameObjects.Image;
  private _playerInfo: RemotePlayerInfo;
  private _tankControl: GameControl;
  private _tankSounds: TankSounds;
  private _bullet: RemoteBullet;
  private _previousBulletStatus: BulletStatus = BulletStatus.IDLE;
  private _updatedAt: number = 0;
  private _previousUpdatedAt: number = 0;
  private _previousPosX: number = 0;
  private _previousPosY: number = 0;
  private _velocityX: number = 0;
  private _velocityY: number = 0;
  private _serverState: RemotePlayerState;

  constructor(
    scene: Phaser.Scene,
    playerLayer: Phaser.GameObjects.Layer,
    uiLayer: Phaser.GameObjects.Layer,
    connectedRoom: Room,
    state: RemotePlayerState
  ) {
    this._scene = scene;
    this._serverState = { ...state };
    this._playerId = state.playerId;
    this._connectedRoom = connectedRoom;
    this._isActive = state.isOn;
    this._fuel = state.fuel;
    this._playerLayer = playerLayer;
    this._uiLayer = uiLayer;
    this._tankSounds = new TankSounds(
      scene,
      () => this._onEngineStartComplete(),
      () => this._onEngineStopComplete(),
      () => this._onExplodeComplete(),
      () => {}
    );
    this._tankBody = scene.add.image(0, 0, 'tilesetTank', TankBaseConfig.name);
    this._tankTurret = scene.add.image(
      0,
      0,
      'tilesetTank',
      TankTurretConfig.name
    );

    this._tankExhaust = new TankExhaust(scene, this._tankBody);
    this._tankExhaust.stop();
    this._tankHUD = new TankHUD(
      scene,
      scene.cameras.main.centerX,
      scene.cameras.main.height - 80,
      () => this._start(),
      () => this._stop()
    );
    this._tankTarget = scene.add
      .image(state.targetX, state.targetY, 'tilesetTank', 'crosshair')
      .setTint(0x00ff00)
      .setVisible(false);
    this._playerInfo = new RemotePlayerInfo(
      scene,
      10,
      10,
      this._playerId,
      this._fuel
    );
    this._tankControl = new GameControl(
      scene,
      () => this._fire(),
      (x: number, y: number) => this._setTarget(x, y),
      () => this._moveForward(),
      () => this._moveBackward(),
      () => this._rotateRight(),
      () => this._rotateLeft(),
      () => this._neutral()
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
    this._uiLayer.add([this._playerInfo, this._tankHUD, this._tankTarget]);

    this._playerLayer.add([
      this._tankBody,
      this._tankTurret,
      this._tankExhaust,
      this._bullet,
    ]);
    this._scene.cameras.main.startFollow(this._tankBody, true, 0.2, 0.2, 0, 0);
  }

  setServerState(serverState: RemotePlayerState) {
    this._previousBulletStatus = this._serverState.bulletStatus;
    this._previousUpdatedAt = this._updatedAt;
    this._previousPosX = this._serverState.x;
    this._previousPosY = this._serverState.y;
    this._serverState = { ...serverState };
    this._updatedAt = Date.now();
    const timePassed = this._updatedAt - this._previousUpdatedAt;
    if (timePassed > 30) {
      this._velocityX =
        (10 * (serverState.x - this._previousPosX)) / timePassed;
      this._velocityY =
        (10 * (serverState.y - this._previousPosY)) / timePassed;
    }
  }

  updatePlayer(_time: number, _delta: number) {
    if (this._isActive !== this._serverState.isOn) {
      this._isActive = this._serverState.isOn;
      if (!this._isActive) {
        this._stop();
      }
    }
    this._isReadyToFire = this._serverState.isReadyToFire;
    this._fuel = this._serverState.fuel;

    this._scene.tweens.add({
      targets: this._tankBody,
      x: this._serverState.x,
      y: this._serverState.y,
      duration: 200,
      ease: 'Power2',
    });
    this._scene.tweens.add({
      targets: this._tankTurret,
      x: this._serverState.x,
      y: this._serverState.y,
      duration: 200,
      ease: 'Power2',
    });

    this._tankBody.rotation = this._serverState.r;
    this._tankTurret.rotation = this._serverState.turretR;
    this._tankTarget.x = this._serverState.targetX;
    this._tankTarget.y = this._serverState.targetY;

    const direction = new Phaser.Math.Vector2(0, 0);
    direction.setToPolar(this._tankBody.rotation, 1);

    this._tankExhaust.updateExhaust(direction);
    this._tankControl.updateGameControl();

    if (this._uiLayer?.visible) {
      this._updateHud();
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
      .setDepth(this._playerLayer.depth);
    this._tankSounds.playExplosion();
    this._tankBody.destroy();
    this._tankTurret.destroy();
    this._tankExhaust.destroy();
    this._playerInfo.destroy();
  }

  private _onExplodeComplete() {
    this._tankSounds.destroy();
  }

  private _setTarget(x: number, y: number) {
    if (this._isActive) {
      const setTargetCommand: PlayerCommand = {
        type: PlayerCommands.SET_TARGET,
        params: {
          x,
          y,
        },
      };
      this._connectedRoom.send(0, setTargetCommand);
    }
  }

  private _start() {
    log.debug('START PLAYER');
    if (this._fuel > 0) {
      this._scene.cameras.main.shake(
        1000,
        0.01,
        false,
        (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
          if (progress === 1) {
            const startCommand: PlayerCommand = {
              type: PlayerCommands.ENGINE_ON,
            };
            this._connectedRoom.send(0, startCommand);
          }
        }
      );
      this._tankExhaust.start();
      this._tankSounds.playEngineStart();
    } else {
      // play engine not starting sound
    }
  }

  private _onEngineStartComplete() {
    this._tankTarget.setVisible(true);
    this._tankHUD.releaseLock();
  }

  private _stop() {
    log.debug('STOP PLAYER');
    this._tankTarget.setVisible(false);
    this._scene.cameras.main.shake(
      1000,
      0.01,
      false,
      (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          const stopCommand: PlayerCommand = {
            type: PlayerCommands.ENGINE_OFF,
          };
          this._connectedRoom.send(0, stopCommand);
        }
      },
      this
    );
    this._tankSounds.stopEngine();
  }

  private _onEngineStopComplete() {
    this._tankExhaust.stop();
    this._tankHUD.releaseLock();
  }

  private _neutral() {
    const neutralCommand: PlayerCommand = {
      type: PlayerCommands.ACTION,
      action: PlayerActions.NEUTRAL,
    };
    this._connectedRoom.send(0, neutralCommand);
    if (this._isActive) {
      this._tankSounds.playIdle();
    }
  }

  private _moveForward() {
    if (this._isActive) {
      const moveForwardCommand: PlayerCommand = {
        type: PlayerCommands.ACTION,
        action: PlayerActions.MOVE_FORWARD,
      };
      this._connectedRoom.send(0, moveForwardCommand);
      this._tankSounds.playFast();
    }
  }

  private _moveBackward() {
    if (this._isActive) {
      const moveBackwardCommand: PlayerCommand = {
        type: PlayerCommands.ACTION,
        action: PlayerActions.MOVE_BACKWARD,
      };
      this._connectedRoom.send(0, moveBackwardCommand);
      this._tankSounds.playSlow();
    }
  }

  private _rotateLeft() {
    if (this._isActive) {
      const rotateLeftCommand: PlayerCommand = {
        type: PlayerCommands.ACTION,
        action: PlayerActions.ROTATE_LEFT,
      };
      this._connectedRoom.send(0, rotateLeftCommand);
      this._tankSounds.playAverage();
    }
  }

  private _rotateRight() {
    if (this._isActive) {
      const rotateRightCommand: PlayerCommand = {
        type: PlayerCommands.ACTION,
        action: PlayerActions.ROTATE_RIGHT,
      };
      this._connectedRoom.send(0, rotateRightCommand);
      this._tankSounds.playAverage();
    }
  }

  private _fire() {
    if (this._isActive && this._isReadyToFire) {
      const fireCommand: PlayerCommand = {
        type: PlayerCommands.ACTION,
        action: PlayerActions.FIRE,
      };
      this._connectedRoom.send(0, fireCommand);
    } else {
      this._tankSounds.playDryFire();
    }
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
          this._tankSounds.playFire();
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

  private _updateHud() {
    // update HUD items
    // fuel
    const fuelLevel =
      (this._tankHUD.Gauge1Limit * 2 * this._fuel) / TankBaseConfig.fuelMax;
    this._tankHUD.setGauge1(fuelLevel - this._tankHUD.Gauge1Limit);

    // speed
    const speed = Math.sqrt(this._velocityX ** 2 + this._velocityY ** 2);
    const speedLevel =
      (2 * this._tankHUD.Gauge2Limit * speed) / 6 - this._tankHUD.Gauge2Limit;
    this._tankHUD.setGauge2(speedLevel);

    // thrust
    let thrustLevel = -this._tankHUD.Gauge3Limit + 40;
    if (this._serverState.thrust !== 0) {
      thrustLevel =
        -this._tankHUD.Gauge3Limit +
        40 +
        (0.4 * Math.abs(this._serverState.thrust) - 40 * speed);
    }
    this._tankHUD.setGauge3(thrustLevel);

    // isReadyToFire
    this._tankHUD.toggleLight2(this._isReadyToFire);

    // update player info
    this._playerInfo.updateRemotePlayerInfo(
      this._tankBody.x,
      this._tankBody.y,
      this._fuel
    );
    // update score
    // update turns
  }
}
