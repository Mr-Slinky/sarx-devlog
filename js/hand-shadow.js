/*
 * Moves the hand's shadow across the hero's ground, towards the point under the cursor.
 *
 * The shadow follows the cursor on a critically damped spring, the motion that Sarx chose for
 * turning the bones of the hand. Such a spring reaches its target as fast as it can without
 * overshooting. The shadow shrinks as it moves towards the horizon, since the ground there is
 * further away.
 */
(() => {
    const hero = document.querySelector(".hero");
    const ground = hero?.querySelector(".ground");
    const shadow = hero?.querySelector(".hand-shadow");
    if (!hero || !ground || !shadow) {
        return;
    }

    // How quickly the spring pulls the shadow towards its target, in radians per second
    const SPRING_RATE = 9;
    // The scale of the shadow at the horizon, and at the bottom edge of the hero
    const FAR_SCALE = 0.3;
    const NEAR_SCALE = 1.15;
    // The distance and speed, in pixels, below which the shadow counts as settled
    const SETTLE_DISTANCE = 0.3;
    const SETTLE_SPEED = 2;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    let horizon = 0;
    let bottom = 0;
    let position = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let frame = 0;
    let lastTime = 0;

    // Returns the resting point of the shadow, a little right of centre and two thirds down the ground
    function findRestPoint() {
        return { x: hero.clientWidth * 0.68, y: horizon + (bottom - horizon) * 0.62 };
    }

    // Reads where the ground starts and ends, in pixels from the top of the hero
    function measureGround() {
        horizon = ground.offsetTop;
        bottom = hero.clientHeight;
    }

    // Draws the shadow at its position, scaled by how far down the ground it sits
    function drawShadow() {
        const depth = (position.y - horizon) / (bottom - horizon);
        const scale = FAR_SCALE + (NEAR_SCALE - FAR_SCALE) * Math.min(Math.max(depth, 0), 1);
        shadow.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
    }

    // Advances the spring by one frame, then asks for another frame until the shadow settles
    function step(time) {
        // Caps the step, so that a frame after a hidden tab does not fling the shadow
        const seconds = Math.min((time - lastTime) / 1000, 1 / 30);
        lastTime = time;

        for (const axis of ["x", "y"]) {
            const offset = target[axis] - position[axis];
            const acceleration = SPRING_RATE * SPRING_RATE * offset - 2 * SPRING_RATE * velocity[axis];
            velocity[axis] += acceleration * seconds;
            position[axis] += velocity[axis] * seconds;
        }
        drawShadow();

        const distance = Math.hypot(target.x - position.x, target.y - position.y);
        const speed = Math.hypot(velocity.x, velocity.y);
        frame = distance < SETTLE_DISTANCE && speed < SETTLE_SPEED ? 0 : requestAnimationFrame(step);
    }

    // Starts the spring, unless a frame is already on its way
    function startSpring() {
        if (frame === 0) {
            lastTime = performance.now();
            frame = requestAnimationFrame(step);
        }
    }

    // Aims the shadow at the ground under the cursor, held between the horizon and the bottom edge
    function aimAtCursor(event) {
        const bounds = hero.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        target = { x, y: Math.min(Math.max(y, horizon + 12), bottom - 12) };
        startSpring();
    }

    // Sends the shadow back to its resting point once the cursor leaves the hero
    function returnToRest() {
        target = findRestPoint();
        startSpring();
    }

    // Places the shadow at rest at once, with no motion
    function placeAtRest() {
        measureGround();
        position = findRestPoint();
        target = { ...position };
        velocity = { x: 0, y: 0 };
        drawShadow();
    }

    placeAtRest();
    window.addEventListener("resize", placeAtRest);

    // Follows the cursor only with a mouse, and only for readers who accept motion
    if (finePointer.matches && !reducedMotion.matches) {
        hero.addEventListener("pointermove", aimAtCursor);
        hero.addEventListener("pointerleave", returnToRest);
    }
})();
