import { Client, Room } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";
import { EGameState, GameState, TestRoomState } from "./types";

export async function main(options: Options) {
  const client = new Client(options.endpoint);
  const room: Room = await client.joinOrCreate(options.roomName, {
    // your join options here...
  });

  console.log("joined successfully!");

  room.onMessage("0", (payload) => {
    // logic
    console.log("received:", payload);
  });

  room.onStateChange((state: TestRoomState) => {
    console.log("game state:", state.gameState.state);
    console.log("game countDown:", state.gameState.countDown);
  });

  room.onLeave((code) => {
    console.log("left");
  });
}

cli(main);
