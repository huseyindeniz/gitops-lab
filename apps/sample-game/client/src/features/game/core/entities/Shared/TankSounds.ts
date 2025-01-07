export class TankSounds {
  private _engineStart: Phaser.Sound.BaseSound;
  private _engineStop: Phaser.Sound.BaseSound;
  private _engineIdle: Phaser.Sound.BaseSound;
  private _engineSlow: Phaser.Sound.BaseSound;
  private _engineAverage: Phaser.Sound.BaseSound;
  private _engineFast: Phaser.Sound.BaseSound;
  private _fire: Phaser.Sound.BaseSound;
  private _dryFire: Phaser.Sound.BaseSound;
  private _turret: Phaser.Sound.BaseSound;
  private _explosion: Phaser.Sound.BaseSound;
  private _beingHit: Phaser.Sound.BaseSound;
  private _onStart: () => void;
  private _onStop: () => void;
  private _onExplode: () => void;
  private _onFire: () => void;

  constructor(
    scene: Phaser.Scene,
    onStart: () => void,
    onStop: () => void,
    onExplode: () => void,
    onFire: () => void
  ) {
    this._engineStart = scene.sound.add('engine_start');
    this._engineStop = scene.sound.add('engine_stop');
    this._engineIdle = scene.sound.add('engine_idle');
    this._engineSlow = scene.sound.add('engine_slow');
    this._engineAverage = scene.sound.add('engine_average');
    this._engineFast = scene.sound.add('engine_fast');
    this._fire = scene.sound.add('fire');
    this._dryFire = scene.sound.add('dryFire');
    this._turret = scene.sound.add('turret');
    this._explosion = scene.sound.add('explosion');
    this._beingHit = scene.sound.add('beinghit');
    this._onStart = onStart;
    this._onStop = onStop;
    this._onExplode = onExplode;
    this._onFire = onFire;

    this._engineStart.on('complete', () => {
      this._onStart();
    });

    this._engineStop.on('complete', () => {
      this._stopIdle();
      this._stopSlow();
      this._stopAverage();
      this._stopFast();
      this._onStop();
    });

    this._explosion.on('complete', () => {
      this.stopTurret();
      this._stopIdle();
      this._stopSlow();
      this._stopAverage();
      this._stopFast();
      this._onExplode();
    });

    this._fire.on('complete', () => {
      this._onFire();
    });
  }

  public stopAll() {
    this.stopTurret();
    this._stopIdle();
    this._stopSlow();
    this._stopAverage();
    this._stopFast();
  }

  public playEngineStart() {
    if (!this._engineStart.isPlaying) {
      this._engineStart.play({ volume: 0.1 });
    }
  }

  public stopEngine() {
    if (this._engineStart.isPlaying) {
      this._engineStart.stop();
    }
    if (!this._engineStop.isPlaying) {
      this._engineStop.play({ volume: 0.3 });
    }
  }

  public playIdle() {
    if (!this._engineIdle.isPlaying) {
      this._stopSlow();
      this._stopAverage();
      this._stopFast();
      this._engineIdle.play({
        loop: true,
        volume: 0.1,
      });
    }
  }

  public playSlow() {
    if (!this._engineSlow.isPlaying && !this._engineFast.isPlaying) {
      this._stopIdle();
      this._stopAverage();
      this._stopFast();
      this._engineSlow.play({
        loop: true,
        volume: 0.1,
      });
    }
  }

  public playAverage() {
    if (
      !this._engineAverage.isPlaying &&
      !this._engineSlow.isPlaying &&
      !this._engineFast.isPlaying
    ) {
      this._stopIdle();
      this._stopSlow();
      this._stopFast();
      this._engineAverage.play({
        loop: true,
        volume: 0.1,
      });
    }
  }

  public playFast() {
    if (!this._engineFast.isPlaying) {
      this._stopIdle();
      this._stopSlow();
      this._stopAverage();
      this._engineFast.play({
        loop: true,
        volume: 0.1,
      });
    }
  }

  public playFire(volume = 0.3) {
    if (!this._fire.isPlaying) {
      this._fire.play({ loop: false, volume });
    }
  }

  public playDryFire() {
    if (!this._dryFire.isPlaying) {
      this._dryFire.play({
        loop: false,
        volume: 0.2,
      });
    }
  }

  public playTurret() {
    if (!this._turret.isPlaying) {
      this._turret.play({ volume: 0.1 });
    }
  }

  public stopTurret() {
    if (this._turret.isPlaying) {
      this._turret.stop();
    }
  }

  public playBeingHit() {
    if (!this._beingHit.isPlaying) {
      this._beingHit.play({
        loop: false,
        volume: 0.3,
      });
    }
  }

  public playExplosion() {
    if (!this._explosion.isPlaying) {
      this._explosion.play({ volume: 0.3 });
    }
  }

  public destroy() {
    this.stopTurret();
    this._stopIdle();
    this._stopSlow();
    this._stopAverage();
    this._stopFast();
  }

  private _stopIdle() {
    if (this._engineIdle.isPlaying) {
      this._engineIdle.stop();
    }
  }
  private _stopSlow() {
    if (this._engineSlow.isPlaying) {
      this._engineSlow.stop();
    }
  }
  private _stopAverage() {
    if (this._engineAverage.isPlaying) {
      this._engineAverage.stop();
    }
  }
  private _stopFast() {
    if (this._engineFast.isPlaying) {
      this._engineFast.stop();
    }
  }
}
