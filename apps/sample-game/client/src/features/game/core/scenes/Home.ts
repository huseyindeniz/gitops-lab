import { Room } from 'colyseus.js';
import log from 'loglevel';

import { GamerServerAPI } from '@/services/gameserver/GameServerAPI';

import { SCENES } from '../config/Scenes';
import { GameDebugText } from '../entities/Debug/GameDebugText';
import { RemoteEnemy } from '../entities/Remote/RemoteEnemy';
import { RemotePlayer } from '../entities/Remote/RemotePlayer';
import { Preloader } from '../utils/Preloader';

export class SceneHome extends Preloader {
  private _fixedTimeStep: number = 1000 / 60;
  private _elapsedTime: number = 0;
  private _secondsTimer: number = 0;
  private _mapWidth: number = 4096;
  private _mapHeight: number = 2560;
  private _gameServerAPI: GamerServerAPI;
  private _layerPlayer?: Phaser.GameObjects.Layer;
  private _layerUI?: Phaser.GameObjects.Layer;
  private _connectedRoom?: Room;
  private _enemies: { [sessionId: string]: RemoteEnemy } = {};
  private _player?: RemotePlayer;
  private _gameDebugText?: GameDebugText;

  private _groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private _bottomLayer?: Phaser.Tilemaps.TilemapLayer | null = null;
  private _topLayer?: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super(SCENES.HOME);
    this._gameServerAPI = GamerServerAPI.getInstance();
  }

  preload() {
    super.preload();

    // Sound: Menu Hover
    this.load.audio('menuhover', [
      'tilesetMenu/sounds/menuhover.mp3',
      'tilesetMenu/sounds/menuhover.m4a',
      'tilesetMenu/sounds/menuhover.ogg',
    ]);
    // Sound: Menu Click
    this.load.audio('menuclick', [
      'tilesetMenu/sounds/menuclick.mp3',
      'tilesetMenu/sounds/menuclick.m4a',
      'tilesetMenu/sounds/menuclick.ogg',
    ]);

    // Tileset: Tank
    this.load.atlas(
      'tilesetTank',
      'tilesetTank/tilesetTank.png',
      'tilesetTank/tilesetTank.json'
    );

    // Sounds: Tank
    this.load.audio('engine_start', 'tilesetTank/sounds/engine_start_seq.mp3');
    this.load.audio('engine_stop', 'tilesetTank/sounds/engine_stop_seq.mp3');
    this.load.audio('engine_idle', 'tilesetTank/sounds/engine_heavy_loop.mp3');
    this.load.audio(
      'engine_slow',
      'tilesetTank/sounds/engine_heavy_slow_loop.mp3'
    );
    this.load.audio(
      'engine_average',
      'tilesetTank/sounds/engine_heavy_average_loop.mp3'
    );
    this.load.audio(
      'engine_fast',
      'tilesetTank/sounds/engine_heavy_fast_loop.mp3'
    );
    this.load.audio('fire', 'tilesetTank/sounds/fire.mp3');
    this.load.audio('dryFire', 'tilesetTank/sounds/dry.mp3');
    this.load.audio('turret', 'tilesetTank/sounds/turret.mp3');
    this.load.audio('explosion', 'tilesetTank/sounds/explosion.mp3');
    this.load.audio('beinghit', 'tilesetTank/sounds/being-hit.mp3');

    // Physics: Tank
    this.load.json('turret-body', 'tilesetTank/turret-body.json');
    this.load.json('radar-body', 'tilesetTank/radar-body.json');

    // map
    this.load.image('limbo-background', 'maps/limbo-simplified/background.png');
    this.load.image(
      'limbo-groundLayerTileset',
      'maps/limbo-simplified/groundLayerTileset.png'
    );
    this.load.image(
      'limbo-bottomLayerTileset',
      'maps/limbo-simplified/bottomLayerTileset.png'
    );
    this.load.image(
      'limbo-topLayerTileset',
      'maps/limbo-simplified/topLayerTileset.png'
    );
    this.load.tilemapTiledJSON(
      'limbo-map',
      'maps/limbo-simplified/mapLimbo-simplified.json'
    );
  }

  create = async () => {
    this._elapsedTime = 0;
    this._secondsTimer = 0;

    this.matter.world.setBounds(0, 0, this._mapWidth, this._mapHeight);
    this.cameras.main.setBounds(0, 0, this._mapWidth, this._mapHeight);

    // INPUT CONFIG
    this.input.setPollAlways();
    this.input.mouse?.disableContextMenu();

    // set default cursor
    this.input?.setDefaultCursor(
      'url(assets/game/shared/images/crosshair.png), pointer'
    );

    this._layerPlayer = this.add.layer().setDepth(10);
    this._layerUI = this.add.layer().setDepth(100).setAlpha(0.7);

    // Game Info
    this._gameDebugText = new GameDebugText(
      this,
      this.cameras.main.centerX,
      10
    );
    this._gameDebugText.setScrollFactor(0, 0);
    this._layerUI.add(this._gameDebugText);

    this._loadFullMap();

    // Connect to Test Room
    this._connectedRoom = await this._gameServerAPI.joinRoom('test_room');

    this._listenServer();

    // Start
    this.cameras.main.fadeIn(1000);
  };

  update(time: number, delta: number): void {
    this._elapsedTime += delta;
    this._secondsTimer += delta;
    while (this._elapsedTime >= this._fixedTimeStep) {
      this._elapsedTime -= this._fixedTimeStep;
      this._fixedTick(time, this._fixedTimeStep);
    }
    this._updateOnSeconds(time, delta);
  }

  private _fixedTick(time: number, delta: number) {
    this._player?.updatePlayer(time, delta);
    for (const sessionId in this._enemies) {
      const enemy = this._enemies[sessionId];
      enemy.updateEnemy(time, delta);
    }
  }

  private _updateOnSeconds(time: number, delta: number) {
    if (this._secondsTimer > 1000) {
      // update game info
      this._gameDebugText?.updateDebugText(time, delta);
      this._secondsTimer = 0;
    }
  }

  private _loadMap() {
    this.add.tileSprite(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this._mapWidth * 2,
      this._mapHeight * 2,
      'limbo-background'
    );
  }

  private _loadFullMap() {
    this._loadMap();

    const mapLimbo = this.add.tilemap('limbo-map', 32, 32, 128, 80);
    mapLimbo.addTilesetImage('groundLayerTileset', 'limbo-groundLayerTileset');
    mapLimbo.addTilesetImage('bottomLayerTileset', 'limbo-bottomLayerTileset');
    mapLimbo.addTilesetImage('topLayerTileset', 'limbo-topLayerTileset');

    this._groundLayer = mapLimbo.createLayer('ground', 'groundLayerTileset');
    this._bottomLayer = mapLimbo.createLayer('bottom', 'bottomLayerTileset');
    this._topLayer = mapLimbo.createLayer('top', 'topLayerTileset');

    this._groundLayer?.setDepth(0);
    this._bottomLayer?.setDepth(10);
    this._layerPlayer?.setDepth(20);
    this._topLayer?.setDepth(30);
  }

  private _listenServer() {
    this._listenRoom();
    this._listenPlayers();
  }

  private _listenRoom() {
    this._connectedRoom?.onMessage('0', payload => {
      // message received from colysues
      log.debug('received:', payload);
    });

    this._connectedRoom?.onError((code, message) => {
      // room error received from colysues
      log.debug('room error:', code, message);
    });
  }

  private _listenPlayers() {
    this._connectedRoom?.state.players.onAdd(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (playerState: any, sessionId: string) => {
        if (this._connectedRoom && this._layerPlayer && this._layerUI) {
          if (this._connectedRoom?.sessionId === sessionId) {
            const player = new RemotePlayer(
              this,
              this._layerPlayer,
              this._layerUI,
              this._connectedRoom,
              playerState
            );
            this._player = player;
            playerState.onChange(() => {
              player.setServerState(playerState);
            });
          } else {
            const enemy = new RemoteEnemy(
              this,
              this._layerPlayer,
              this._layerUI,
              playerState
            );
            this._enemies[sessionId] = enemy;
            playerState.onChange(() => {
              enemy.setServerState(playerState);
            });
          }
        }
      },
      false
    );

    this._connectedRoom?.state.players.onRemove(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_playerState: any, sessionId: string) => {
        const player = this._enemies[sessionId];
        if (player) {
          // destroy entity
          player.explode();
          // clear local reference
          delete this._enemies[sessionId];
        } else {
          this._player?.explode();
        }
      }
    );
  }
}
