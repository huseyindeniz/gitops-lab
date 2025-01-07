import Matter from "matter-js";
import { TestRoomState } from "./rooms/schema/TestRoomState";
import path from "path";
import { PlayerState } from "./rooms/schema/PlayerState";
import { PlayerActions } from "./config/PlayerCommands";
import { Tank } from "./entities/Tank";

import { BULLET_CATEGORY, PLAYER_CATEGORY } from "./config/Categories";
import { GameMap } from "./entities/GameMap";
import { EGameState } from "./rooms/schema/GameState";

export class GameEngine {
  public engine: Matter.Engine = null;
  private _maxPlayers: number = -1;
  private _world: Matter.World = null;
  private _gameMap: GameMap = null;
  private _state: TestRoomState = null;
  private _players: Map<string, Tank> = new Map();

  constructor(state: TestRoomState, maxPlayers = 2) {
    this.engine = Matter.Engine.create();
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.engine.enabled = false;
    this._state = state;
    this._world = this.engine.world;
    this._maxPlayers = maxPlayers;

    this._gameMap = new GameMap(this._world);
    this._init();
  }

  public addPlayer(sessionId: string) {
    // get random spawn point
    const randomSpawnPoint = this._gameMap.getRandomSpawnPoint();

    // add player to world
    const newPlayer = new Tank(
      this._world,
      sessionId,
      randomSpawnPoint.x,
      randomSpawnPoint.y
    );
    this._players.set(sessionId, newPlayer);

    // Add player to state
    this._state.createPlayer(sessionId);

    if (this._state.players.size === this._maxPlayers) {
      this.engine.enabled = true;
    }
  }

  public removePlayer(sessionId: string) {
    // Remove from world
    const player = this._players.get(sessionId);
    if (player) {
      player.explode();
      this._players.delete(sessionId);
    }
    // Remove from state
    this._state.removePlayer(sessionId);
    if (this._state.players.size === 1) {
      this._state.gameState.state = EGameState.ENDED;
    }
  }

  public updatePlayer(playerState: PlayerState) {
    const player = this._players.get(playerState.playerId);
    if (player) {
      player.update(playerState.targetX, playerState.targetY);
    }
  }

  public executePlayerAction(playerState: PlayerState, action: PlayerActions) {
    //this._logger.debug(`DATA:${action}`);
    const player = this._players.get(playerState.playerId);
    player.executeAction(action);
  }

  private _init() {
    this._initUpdateEvents();
    this._initCollisionEvents();
  }

  private _initUpdateEvents() {
    // Update events to sync bodies in the world to the state.
    Matter.Events.on(this.engine, "afterUpdate", () => {
      this._players.forEach((player: Tank, key: string) => {
        if (this._state.players.has(key)) {
          const playerState = this._state.players.get(key);
          const entityState = player.getState();
          playerState.x = entityState.x;
          playerState.y = entityState.y;
          playerState.r = entityState.r;
          playerState.thrust = entityState.thrust;
          playerState.turretR = entityState.turretR;
          playerState.isReadyToFire = entityState.isReadyToFire;
          playerState.bulletStatus = entityState.bulletStatus;
          playerState.bulletX = entityState.bulletX;
          playerState.bulletY = entityState.bulletY;
          playerState.bulletR = entityState.bulletR;
        }
      });
    });
  }

  private _initCollisionEvents() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pair = event.pairs[0];
      const { bodyA, bodyB } = pair;
      const objectACategory = bodyA?.collisionFilter?.category;
      const objectBCategory = bodyB?.collisionFilter?.category;

      if (
        objectACategory === BULLET_CATEGORY ||
        objectBCategory === BULLET_CATEGORY
      ) {
        const bulletBody = objectACategory === BULLET_CATEGORY ? bodyA : bodyB;
        const player = this._players.get(bulletBody.label);
        if (player) {
          //this._logger.debug("BULLET WILL EXPLODE: HIT SMT");
          player.explodeBullet();
          // check if other body is bullet and check if impact is strong enough
          if (
            objectACategory === PLAYER_CATEGORY ||
            objectBCategory === PLAYER_CATEGORY
          ) {
            const playerBody =
              objectACategory === PLAYER_CATEGORY ? bodyA : bodyB;
            const playerHit = this._players.get(playerBody.label);
            if (playerHit) {
              /*
              this._logger.debug(
                `PLAYER HIT BY SMT. playerid:
                ${playerHit._playerId} depth:
                ${pair.collision.depth}
                `
              );
              */
              this.removePlayer(playerHit._playerId);
            }
          }
        }
      }
    });
  }
}
