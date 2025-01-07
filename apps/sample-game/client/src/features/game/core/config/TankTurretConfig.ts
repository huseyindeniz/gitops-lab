export type TankTurretConfigProps = {
  name: string;
  width: number;
  height: number;
  offset: {
    x: number;
    y: number;
  };
  mass: number;
  friction: number;
  frictionAir: number;
  rotationSpeed: number;
  rotationTolerance: number;
};

export const TankTurretConfig: TankTurretConfigProps = {
  name: 'tank-turret-lucifer',
  width: 69,
  height: 31,
  offset: {
    x: -4,
    y: 1,
  },
  mass: 2,
  friction: 0.8,
  frictionAir: 0.8,
  rotationSpeed: 0.2,
  rotationTolerance: 0.02,
};
