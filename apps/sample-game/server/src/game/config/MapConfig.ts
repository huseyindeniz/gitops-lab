export type MapConfigProps = {
  width: number;
  height: number;
  spawnPoints: {
    x: number;
    y: number;
  }[];
};

export const MapConfig: MapConfigProps = {
  width: 4096,
  height: 2560,
  spawnPoints: [
    {
      x: 864,
      y: 608,
    },
    {
      x: 1920,
      y: 960,
    },
    {
      x: 3616,
      y: 1088,
    },
    {
      x: 3296,
      y: 1952,
    },
  ],
};
