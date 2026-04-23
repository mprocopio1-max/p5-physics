let Engine = Matter.Engine,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Events = Matter.Events;

let engine;
let world;

let brushes = [];
let brushById = new Map();
let obstacles = [];
let flippers = [];
let drain;

let score = 0;
let lives = 3;
let gameOver = false;
let nextSpawnFrame = -1;

let leftTouchActive = false;
let rightTouchActive = false;
let sensorButton;

const BALL_RADIUS = 12;
const MAX_BALL_SPEED = 22;

function setupField() {
  const wallColor = color(40, 57, 77);
  const wallStroke = color(200, 210, 225);

  obstacles.push(
    new Obstacle(width * 0.5, 20, width - 30, 28, 0, {
      label: 'wall',
      color: wallColor,
      strokeColor: wallStroke,
      restitution: 0.75,
      friction: 0.01
    })
  );

  obstacles.push(
    new Obstacle(14, height * 0.5, 28, height, 0, {
      label: 'wall',
      color: wallColor,
      strokeColor: wallStroke,
      restitution: 0.78,
      friction: 0.01
    })
  );

  obstacles.push(
    new Obstacle(width - 14, height * 0.5, 28, height, 0, {
      label: 'wall',
      color: wallColor,
      strokeColor: wallStroke,
      restitution: 0.78,
      friction: 0.01
    })
  );

  // Inner guides funnel the ball toward active flippers.
  obstacles.push(
    new Obstacle(width * 0.24, height * 0.78, width * 0.26, 18, -0.42, {
      label: 'obstacle',
      color: color(81, 105, 125),
      restitution: 0.58,
      friction: 0.015
    })
  );

  obstacles.push(
    new Obstacle(width * 0.76, height * 0.78, width * 0.26, 18, 0.42, {
      label: 'obstacle',
      color: color(81, 105, 125),
      restitution: 0.58,
      friction: 0.015
    })
  );

  obstacles.push(
    new Obstacle(width * 0.35, height * 0.46, width * 0.28, 16, 0.45, {
      label: 'obstacle',
      color: color(96, 124, 148),
      restitution: 0.62,
      friction: 0.02
    })
  );

  obstacles.push(
    new Obstacle(width * 0.67, height * 0.57, width * 0.26, 16, -0.52, {
      label: 'obstacle',
      color: color(96, 124, 148),
      restitution: 0.62,
      friction: 0.02
    })
  );

  obstacles.push(
    new Obstacle(width * 0.5, height * 0.26, 52, 52, 0, {
      label: 'bumper',
      shape: 'circle',
      radius: 26,
      color: color(248, 120, 104),
      strokeColor: color(255, 230, 225),
      restitution: 1.45,
      friction: 0,
      frictionStatic: 0
    })
  );

  obstacles.push(
    new Obstacle(width * 0.3, height * 0.33, 46, 46, 0, {
      label: 'bumper',
      shape: 'circle',
      radius: 23,
      color: color(255, 176, 75),
      strokeColor: color(255, 237, 197),
      restitution: 1.35,
      friction: 0,
      frictionStatic: 0
    })
  );

  obstacles.push(
    new Obstacle(width * 0.7, height * 0.36, 48, 48, 0, {
      label: 'bumper',
      shape: 'circle',
      radius: 24,
      color: color(100, 201, 255),
      strokeColor: color(223, 244, 255),
      restitution: 1.4,
      friction: 0,
      frictionStatic: 0
    })
  );

  drain = new Obstacle(width * 0.5, height - 8, width * 0.36, 20, 0, {
    label: 'drain',
    isSensor: true,
    color: color(170, 52, 52, 70),
    strokeColor: color(250, 190, 190, 100)
  });
  obstacles.push(drain);

  for (const obstacle of obstacles) {
    Composite.add(world, obstacle.body);
  }

  const flipperY = height - 70;
  const flipperLen = min(150, width * 0.28);
  const flipperThickness = 20;

  const leftFlipper = new Flipper(width * 0.36, flipperY, flipperLen, flipperThickness, 'left');
  const rightFlipper = new Flipper(width * 0.64, flipperY, flipperLen, flipperThickness, 'right');
  flippers.push(leftFlipper, rightFlipper);

  for (const flipper of flippers) {
    Composite.add(world, [flipper.body, flipper.pivot]);
  }
}

function spawnBall(x = width * 0.52, y = height * 0.12) {
  const brush = new Brush(x, y, BALL_RADIUS, {
    label: 'ball',
    color: color(255, 230, 120),
    restitution: 0.32,
    friction: 0.002,
    frictionAir: 0.0018,
    density: 0.0024
  });

  brushes.push(brush);
  brushById.set(brush.body.id, brush);
  Composite.add(world, brush.body);
}

function removeBall(brush) {
  const idx = brushes.indexOf(brush);
  if (idx >= 0) {
    brushes.splice(idx, 1);
  }
  brushById.delete(brush.body.id);
  Composite.remove(world, brush.body);
}

function handleBallDrain(brush) {
  if (!brush || brush.isDraining || gameOver) {
    return;
  }
  brush.isDraining = true;
  removeBall(brush);

  lives -= 1;
  if (lives > 0) {
    nextSpawnFrame = frameCount + 24;
  } else {
    gameOver = true;
  }
}

function resolveCollision(ballBody, otherBody) {
  const brush = brushById.get(ballBody.id);
  if (!brush) {
    return;
  }

  const role = otherBody.label;
  if (role === 'bumper') {
    score += 100;

    const dx = ballBody.position.x - otherBody.position.x;
    const dy = ballBody.position.y - otherBody.position.y;
    const distance = max(1, Math.sqrt(dx * dx + dy * dy));
    const push = 0.045;

    brush.applyImpulse((dx / distance) * push, (dy / distance) * push);
    brush.boost(1.06);
  } else if (role === 'flipper') {
    score += 5;
    brush.boost(1.14);
  } else if (role === 'obstacle') {
    const vx = ballBody.velocity.x;
    const vy = ballBody.velocity.y;
    brush.applyImpulse(vy * 0.0018, -vx * 0.0018);
  } else if (role === 'drain') {
    handleBallDrain(brush);
  }
}

function registerCollisions() {
  Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      const aIsBall = bodyA.label === 'ball';
      const bIsBall = bodyB.label === 'ball';

      if (aIsBall && !bIsBall) {
        resolveCollision(bodyA, bodyB);
      } else if (bIsBall && !aIsBall) {
        resolveCollision(bodyB, bodyA);
      }
    }
  });
}

function createSensorButton() {
  sensorButton = createButton('Request Sensor Access');
  sensorButton.position(10, 10);
  sensorButton.style('z-index', '10');

  sensorButton.mousePressed(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().catch(console.error);
    }

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().catch(console.error);
    }

    sensorButton.remove();
  });
}

function updateGravityFromSensors() {
  const tiltX = constrain(rotationY || 0, -45, 45);
  const tiltY = constrain(rotationX || 0, -45, 45);

  // Keep base downward pull while tilt shifts horizontal/vertical flow.
  world.gravity.x = map(tiltX, -45, 45, -0.55, 0.55);
  world.gravity.y = 0.75 + map(tiltY, -45, 45, -0.5, 0.5);
}

function updateFlipperInput() {
  const sensorLeft = (rotationY || 0) < -17;
  const sensorRight = (rotationY || 0) > 17;
  const keyboardLeft = keyIsDown(65) || keyIsDown(37);
  const keyboardRight = keyIsDown(68) || keyIsDown(39);

  const leftActive = leftTouchActive || sensorLeft || keyboardLeft;
  const rightActive = rightTouchActive || sensorRight || keyboardRight;

  flippers[0].update(leftActive);
  flippers[1].update(rightActive);
}

function keepBallSpeedReasonable() {
  for (const brush of brushes) {
    const velocity = brush.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed > MAX_BALL_SPEED) {
      const factor = MAX_BALL_SPEED / speed;
      Body.setVelocity(brush.body, {
        x: velocity.x * factor,
        y: velocity.y * factor
      });
    }
  }
}

function drawHud() {
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(20);
  text('Score: ' + score, 16, 54);
  text('Lives: ' + lives, 16, 80);

  if (gameOver) {
    textAlign(CENTER, CENTER);
    textSize(34);
    fill(255, 220, 220);
    text('GAME OVER', width * 0.5, height * 0.5 - 10);
    textSize(18);
    text('Tap to restart', width * 0.5, height * 0.5 + 28);
  }
}

function restartGame() {
  for (const brush of brushes) {
    Composite.remove(world, brush.body);
  }
  brushes = [];
  brushById.clear();

  score = 0;
  lives = 3;
  gameOver = false;
  nextSpawnFrame = -1;
  spawnBall();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  world = engine.world;

  setupField();
  spawnBall();
  registerCollisions();
  createSensorButton();
}

function draw() {
  background(12, 22, 35);

  updateGravityFromSensors();
  updateFlipperInput();

  if (!gameOver && brushes.length === 0 && lives > 0 && nextSpawnFrame > 0 && frameCount >= nextSpawnFrame) {
    spawnBall();
    nextSpawnFrame = -1;
  }

  Engine.update(engine);
  keepBallSpeedReasonable();

  for (const obstacle of obstacles) {
    obstacle.display();
  }

  for (const flipper of flippers) {
    flipper.display();
  }

  for (const brush of brushes) {
    brush.display();
  }

  drawHud();
}

function updateTouchStateFromTouches() {
  leftTouchActive = false;
  rightTouchActive = false;

  for (const t of touches) {
    if (t.x < width * 0.5) {
      leftTouchActive = true;
    } else {
      rightTouchActive = true;
    }
  }
}

function touchStarted() {
  if (gameOver) {
    restartGame();
    return false;
  }
  updateTouchStateFromTouches();
  return false;
}

function touchMoved() {
  updateTouchStateFromTouches();
  return false;
}

function touchEnded() {
  updateTouchStateFromTouches();
  return false;
}

function mousePressed() {
  if (gameOver) {
    restartGame();
    return;
  }

  if (mouseX < width * 0.5) {
    leftTouchActive = true;
  } else {
    rightTouchActive = true;
  }
}

function mouseReleased() {
  leftTouchActive = false;
  rightTouchActive = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
