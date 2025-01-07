export type RemotePlayerState = {
  playerId: string;
  isOn: boolean;
  isReadyToFire: boolean;
  fuel: number;
  x: number;
  y: number;
  r: number;
  thrust: number;
  turretR: number;
  targetX: number;
  targetY: number;
  bulletStatus: number;
  bulletX: number;
  bulletY: number;
  bulletR: number;
};
