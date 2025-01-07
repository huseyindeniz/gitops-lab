import log from 'loglevel';

import { TANK_GAUGES_TEXT_STYLE } from '../../config/TextStyles';

export class TankHUD extends Phaser.GameObjects.Container {
  public readonly Gauge1Limit: number = 66;
  public readonly Gauge2Limit: number = 112;
  public readonly Gauge3Limit: number = 112;

  private _isPowerOn: boolean = false;
  private _isLocked: boolean = false;

  private _panel: Phaser.GameObjects.Image;
  private _powerButton: Phaser.GameObjects.Image;
  private _gauge1Box: Phaser.GameObjects.Image;
  private _gauge1Pointer: Phaser.GameObjects.Image;
  private _gauge2Box: Phaser.GameObjects.Image;
  private _gauge2Pointer: Phaser.GameObjects.Image;
  private _gauge3Box: Phaser.GameObjects.Image;
  private _gauge3Pointer: Phaser.GameObjects.Image;
  private _light1: Phaser.GameObjects.Image;
  private _light2: Phaser.GameObjects.Image;
  private _menuClickSound: Phaser.Sound.BaseSound;
  private _menuHoverSound: Phaser.Sound.BaseSound;

  private _onStartCallback: () => void;
  private _onStopCallback: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onStartCallback: () => void,
    onStopCallback: () => void
  ) {
    super(scene, x, y);

    this._onStartCallback = onStartCallback;
    this._onStopCallback = onStopCallback;

    this._menuHoverSound = scene.sound.add('menuhover');
    this._menuClickSound = scene.sound.add('menuclick');

    this._panel = this.scene.add.image(0, 0, 'tilesetTank', 'panel');

    this._powerButton = this.scene.add
      .image(-160, 0, 'tilesetTank', 'power-off')
      .setScrollFactor(0, 0);

    this._gauge1Box = this.scene.add.image(-85, 10, 'tilesetTank', 'gauge1');
    this._gauge1Pointer = this.scene.add
      .image(-85, 0, 'tilesetTank', 'gauge1-pointer')
      .setOrigin(0.47, 0.8)
      .setRotation(-Phaser.Math.DegToRad(this.Gauge1Limit));
    const gauge1Label = this.scene.add
      .text(-85, 50, 'FUEL', TANK_GAUGES_TEXT_STYLE)
      .setOrigin(0.5, 0.5);
    gauge1Label.preFX?.addGlow(0xffffbe, 0, 0.1, false);

    this._gauge2Box = this.scene.add.image(5, 10, 'tilesetTank', 'gauge2');
    this._gauge2Pointer = this.scene.add
      .image(5, 0, 'tilesetTank', 'gauge1-pointer')
      .setOrigin(0.47, 0.8)
      .setRotation(-Phaser.Math.DegToRad(this.Gauge2Limit));
    const gauge2Label = this.scene.add
      .text(5, 50, 'KM/H', TANK_GAUGES_TEXT_STYLE)
      .setOrigin(0.5, 0.5);
    gauge2Label.preFX?.addGlow(0xffffbe, 0, 0.1, false);

    this._gauge3Box = this.scene.add.image(95, 10, 'tilesetTank', 'gauge3');
    this._gauge3Pointer = this.scene.add
      .image(95, 0, 'tilesetTank', 'gauge1-pointer')
      .setOrigin(0.47, 0.8)
      .setRotation(-Phaser.Math.DegToRad(this.Gauge3Limit));
    const gauge3Label = this.scene.add
      .text(95, 50, 'RPM', TANK_GAUGES_TEXT_STYLE)
      .setOrigin(0.5, 0.5);
    gauge3Label.preFX?.addGlow(0xffffbe, 0, 0.1, false);

    this._light1 = this.scene.add.image(160, -15, 'tilesetTank', 'light-off');

    this._light2 = this.scene.add.image(160, 15, 'tilesetTank', 'light-off');

    this._powerButton.setInteractive({ useHandCursor: true });

    this._powerButton.on(
      'pointerover',
      () => {
        if (!this._menuHoverSound.isPlaying) {
          this._menuHoverSound.play({ volume: 0.2 });
        }
      },
      this
    );

    this._powerButton.on(
      'pointerdown',
      () => {
        if (!this._isLocked) {
          this._isLocked = true;
          if (!this._menuClickSound.isPlaying) {
            this._menuClickSound.play({ volume: 0.2 });
          }
          this._handlePowerButtonClick();
        }
      },
      this
    );

    this.add([
      this._panel,
      this._powerButton,
      this._gauge1Box,
      this._gauge1Pointer,
      gauge1Label,
      this._gauge2Box,
      this._gauge2Pointer,
      gauge2Label,
      this._gauge3Box,
      this._gauge3Pointer,
      gauge3Label,
      this._light1,
      this._light2,
    ]);
    this.setScrollFactor(0, 0);
  }

  destroy(fromScene?: boolean | undefined): void {
    super.destroy(fromScene);
  }

  setGauge1(angle: number) {
    this.scene.tweens.add({
      targets: this._gauge1Pointer,
      angle,
      ease: 'linear',
      duration: 100,
    });
  }

  setGauge2(angle: number) {
    this.scene.tweens.add({
      targets: this._gauge2Pointer,
      angle,
      ease: 'linear',
      duration: 100,
    });
  }

  setGauge3(angle: number) {
    this.scene.tweens.add({
      targets: this._gauge3Pointer,
      angle,
      ease: 'linear',
      duration: 100,
    });
  }

  toggleLight1(isOn: boolean) {
    if (isOn) {
      this._light1.setFrame('light-on');
    } else {
      this._light1.setFrame('light-off');
    }
  }

  toggleLight2(isOn: boolean) {
    if (isOn) {
      this._light2.setFrame('light-on');
    } else {
      this._light2.setFrame('light-off');
    }
  }

  releaseLock() {
    log.debug('release lock');
    this._isLocked = false;
  }

  private _handlePowerButtonClick() {
    if (this._isPowerOn) {
      this._stop();
      this._isPowerOn = false;
    } else {
      this._start();
      this._isPowerOn = true;
    }
  }

  private _start() {
    this._onStartCallback();
    this._powerButton.setFrame('power-on');
    this.scene.tweens.add({
      targets: this._gauge1Pointer,
      angle: this.Gauge1Limit,
      ease: 'linear',
      duration: 1000,
    });
    this.scene.tweens.add({
      targets: this._gauge2Pointer,
      angle: this.Gauge2Limit,
      ease: 'linear',
      duration: 100,
    });
    this.scene.tweens.add({
      targets: this._gauge3Pointer,
      angle: this.Gauge3Limit,
      ease: 'linear',
      duration: 100,
    });
  }

  private _stop() {
    this._onStopCallback();
    this._powerButton.setFrame('power-off');
    this.scene.tweens.add({
      targets: this._gauge1Pointer,
      angle: -this.Gauge1Limit,
      ease: 'linear',
      duration: 1000,
    });
    this.scene.tweens.add({
      targets: this._gauge2Pointer,
      angle: -this.Gauge2Limit,
      ease: 'linear',
      duration: 1000,
    });
    this.scene.tweens.add({
      targets: this._gauge3Pointer,
      angle: -this.Gauge3Limit,
      ease: 'linear',
      duration: 1000,
    });
  }
}
