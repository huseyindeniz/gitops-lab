export const ANGLE_MIN = -Math.PI;
export const ANGLE_MAX = Math.PI;
export const ANGLE_RANGE = ANGLE_MAX - ANGLE_MIN;

export const PhaserMathAngleBetween = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const PhaserMathAngleWrap = (value: number) => {
  return (
    ANGLE_MIN +
    ((((value - ANGLE_MIN) % ANGLE_RANGE) + ANGLE_RANGE) % ANGLE_RANGE)
  );
};
