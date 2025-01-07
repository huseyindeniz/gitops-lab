import { Room, Client } from "@colyseus/core";
import { TestRoomState } from "./schema/TestRoomState";
import {
  PlayerActions,
  PlayerCommand,
  PlayerCommands,
} from "../config/PlayerCommands";
import { EGameState } from "./schema/GameState";
import Matter from "matter-js";
import { TankBaseConfig } from "../config/TankBaseConfig";
import { GameEngine } from "../GameEngine";

export class TestRoom extends Room<TestRoomState> {
  maxClients = Number(process.env.TEST_ROOM_CAPACITY);
  elapsedTime = 0;
  secondsTimer = 0;
  fixedTimeStep = 1000 / 60;

  constructor() {
    super();
    console.debug("TestRoom created!");
  }

  private _engine: GameEngine = null;

  onCreate = async (options: any) => {
    this.clock.stop();
    this.setState(new TestRoomState(this.maxClients));
    this._engine = new GameEngine(this.state, this.maxClients);
    this.onMessage(0, (client: Client, input: PlayerCommand) =>
      this._handleOnMessage(client, input)
    );
    this.setSimulationInterval((deltaTime) => {
      this.elapsedTime += deltaTime;
      this.secondsTimer += deltaTime;
      while (this.elapsedTime >= this.fixedTimeStep) {
        this.elapsedTime -= this.fixedTimeStep;
        this._fixedTick(this.fixedTimeStep);
      }
      if (this.secondsTimer > 1000) {
        this.state.updateOnSeconds();
        this.secondsTimer = 0;
      }
    });
    console.debug("room", this.roomId, "created!");
  };

  onJoin = async (client: Client, options: any, auth: any) => {
    console.debug(client.sessionId, "joined!");
    this._engine.addPlayer(client.sessionId);

    if (this.state.players.size === this.maxClients - 1) {
      console.debug("start game");
      this.elapsedTime = 0;
      this.clock.start();
    }
  };

  onLeave = async (client: Client, consented: boolean) => {
    this._engine.removePlayer(client.sessionId);
    console.debug(client.sessionId, "left!");
  };

  onDispose() {
    Matter.World.clear(this._engine.engine.world, false);
    Matter.Engine.clear(this._engine.engine);
    delete this._engine;
    console.debug("room", this.roomId, "disposed...");
  }

  private _handleOnMessage(client: Client, input: PlayerCommand) {
    if (this.state?.gameState?.state !== EGameState.PLAYING) {
      return;
    }
    const playerState = this.state.players?.get(client.sessionId);
    switch (input.type) {
      case PlayerCommands.ENGINE_OFF:
        playerState.isOn = false;
        break;
      case PlayerCommands.ENGINE_ON:
        playerState.isOn = true;
        break;
      case PlayerCommands.SET_TARGET:
        if (input.params?.x && input.params?.y) {
          playerState.targetX = input.params.x;
          playerState.targetY = input.params.y;
        }
        break;
      case PlayerCommands.ACTION:
        if (playerState.isOn) {
          playerState.actionQueue.push(input.action);
        }
        break;
      default:
        break;
    }
  }

  private _fixedTick(deltaTime: number) {
    Matter.Engine.update(this._engine.engine, deltaTime);
    this.state.players.forEach((playerState) => {
      this._engine.updatePlayer(playerState);
      let action: PlayerActions;
      // dequeue player inputs
      while ((action = playerState.actionQueue.shift())) {
        this._engine.executePlayerAction(playerState, action);
      }
      if (playerState.isOn) {
        playerState.fuel -= TankBaseConfig.fuelConsumptionIdle;
        playerState.fuel -=
          (Math.abs(playerState.thrust) *
            TankBaseConfig.fuelConsumptionPerThrust) /
          60;
        if (playerState.fuel < 0) {
          playerState.fuel = 0;
        }
        if (playerState.fuel === 0) {
          playerState.isOn = false;
        }
      }
    });
  }
}
