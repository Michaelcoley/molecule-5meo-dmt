/** Pure camera-framing maths, separated so it can be unit-tested without a
 *  WebGL context. Returns the camera distance at which a sphere of the given
 *  radius fills `fill` of the vertical field of view. */
export function fitDistance(radius: number, fovDeg: number, fill = 0.72): number {
  const fov = (fovDeg * Math.PI) / 180;
  return (radius / Math.sin(fov / 2)) * fill;
}
