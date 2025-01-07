import { Client, Room } from 'colyseus.js';
import log from 'loglevel';

const gameServerSocketUrl = import.meta.env.VITE_GAME_SERVER_SOCKET_URL;
log.info('gameServerSocketUrl:', gameServerSocketUrl);

export class GamerServerAPI {
  private static _instance: GamerServerAPI | null = null;
  private _client: Client;
  private _connectedRoom?: Room;

  private constructor() {
    this._client = new Client(gameServerSocketUrl);
    log.debug('client initalized');
  }

  public static getInstance(): GamerServerAPI {
    if (this._instance === null) {
      this._instance = new GamerServerAPI();
    }
    return this._instance;
  }

  public getAvailableRooms = async () => {
    return await this._client.getAvailableRooms();
  };

  public joinRoom = async (roomName: string) => {
    log.debug('Joining room');
    const room = await this._client.joinOrCreate(roomName, {}).catch(e => {
      log.debug(e);
      // handle error here
    });
    if (room) {
      this._connectedRoom = room;
      log.debug('Joined successfully!');
    }
    return this._connectedRoom;
  };

  public leaveRoom = async () => {
    log.debug('Leaving room');
    this._connectedRoom?.leave();
    log.debug('Room left');
  };
}
