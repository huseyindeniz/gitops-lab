import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { EGameState, GameState } from "./GameState";

export class TestRoomState extends Schema {
  @type(GameState) gameState: GameState = new GameState();

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();

  constructor(maxPlayers: number) {
    super();
    this.gameState.maxPlayers = maxPlayers;
  }

  public updateOnSeconds() {
    if (this.gameState.state === EGameState.ON_COUNT_DOWN) {
      this.gameState.countDown -= 1;
      if (this.gameState.countDown <= 0) {
        this.gameState.state = EGameState.PLAYING;
        this.gameState.countDown = 15;
      }
    }
  }

  public createPlayer(sessionId: string) {
    const newPlayer = new PlayerState(sessionId);
    this.players.set(sessionId, newPlayer);
    if (this.gameState.state === EGameState.IDLE) {
      this.gameState.state = EGameState.WAITING_PLAYERS;
    }
    console.log("player.size", this.players.size, this.gameState.maxPlayers);
    if (this.players.size === this.gameState.maxPlayers) {
      this.gameState.countDown = 15;
      this.gameState.state = EGameState.ON_COUNT_DOWN;
    }
  }

  public removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }
}
