/** Tuned by eye for a ball 0.55 units across on a bench, not for real-world units. */
const GRAVITY = 14;
const LAUNCH_SPEED = 5.2;
/** Share of speed kept after each landing: low enough that it settles in a few hops. */
const RESTITUTION = 0.55;
/** Below this landing speed the ball just stops rather than hopping forever. */
const REST_SPEED = 0.9;
const SQUASH_PER_SPEED = 0.05;
const MAX_SQUASH = 0.3;
/** How fast the squash springs back, per second. */
const SQUASH_RECOVERY = 18;
/** Long frames are split up so a stutter can't tunnel the ball through the bench. */
const MAX_STEP = 1 / 120;

/** A dropped-ball bounce: launched by `kick`, it hops lower each time and settles. */
export function createBounce() {
  let height = 0;
  let speed = 0;
  let squashing = 0;
  let moving = false;

  function step(dt: number) {
    let impact = 0;
    if (moving) {
      speed -= GRAVITY * dt;
      height += speed * dt;
      if (height <= 0) {
        impact = -speed;
        height = 0;
        squashing = Math.min(MAX_SQUASH, impact * SQUASH_PER_SPEED);
        speed = impact * RESTITUTION;
        if (speed < REST_SPEED) {
          speed = 0;
          moving = false;
        }
      }
    }
    squashing *= Math.exp(-SQUASH_RECOVERY * dt);
    if (squashing < 0.001) squashing = 0;
    return impact;
  }

  return {
    get height() {
      return height;
    },
    /** 1 is round; below 1 the ball is flattened from just landing. */
    get squash() {
      return 1 - squashing;
    },
    /** Launches the ball, from `from` if it's resting there mid-hop. */
    kick(from = height) {
      if (!moving) height = from;
      moving = true;
      speed = Math.max(speed, 0) + LAUNCH_SPEED;
    },
    busy() {
      return moving || squashing > 0;
    },
    /** Advances the bounce; returns how hard it landed this frame, or 0 if it didn't. */
    update(dt: number) {
      let impact = 0;
      for (let left = dt; left > 0; left -= MAX_STEP) {
        impact = Math.max(impact, step(Math.min(MAX_STEP, left)));
      }
      return impact;
    },
  };
}
