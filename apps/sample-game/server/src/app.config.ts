import config from "@colyseus/tools";
import cors from 'cors';
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

import { TestRoom } from "./game/rooms/TestRoom";
import {
  LocalDriver,
  LocalPresence,
  RedisPresence,
  ServerOptions,
} from "colyseus";
import { RedisDriver } from "@colyseus/redis-driver";

console.log("NODE_ENV: ", process.env.NODE_ENV);
console.log("REDIS_HOST_URL: ", process.env.REDIS_HOST_URL);
console.log("REDIS_HOST_PORT: ", process.env.REDIS_HOST_PORT);
console.log("TEST_ROOM_CAPACITY: ", process.env.TEST_ROOM_CAPACITY);

let options: ServerOptions = {
  presence: new LocalPresence(),
  driver: new LocalDriver(),
};

if (
  process.env.NODE_ENV !== "local" &&
  process.env.NODE_ENV !== "development"
) {
  options = {
    presence: new RedisPresence({
      host: process.env.REDIS_HOST_URL,
      port: Number(process.env.REDIS_HOST_PORT),
    }),
    driver: new RedisDriver({
      host: process.env.REDIS_HOST_URL,
      port: Number(process.env.REDIS_HOST_PORT),
    }),
  };
}
export default config({
  options: options,

  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define("test_room", TestRoom);
  },

  initializeExpress: (app) => {
    
    app.use(cors({
      origin: "*",
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground);
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
