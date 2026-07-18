/**
 * Pure camera-framing maths, separated so it can be unit-tested without a
 * WebGL context. Returns the camera distance at which a sphere of the given
 * radius fills `fill` of the field of view.
 *
 * `fovDeg` is the camera's vertical FOV. When an `aspect` (width / height) is
 * given and the viewport is portrait (aspect < 1), the horizontal FOV becomes
 * the tighter constraint, so we frame against it — otherwise a wide molecule
 * clips off the sides on tall phone screens.
 */
export function fitDistance(radius: number, fovDeg: number, fill = 0.72, aspect?: number): number {
  const vFov = (fovDeg * Math.PI) / 180;
  let effFov = vFov;
  if (aspect !== undefined && aspect < 1) {
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    effFov = Math.min(vFov, hFov);
  }
  return (radius / Math.sin(effFov / 2)) * fill;
}
