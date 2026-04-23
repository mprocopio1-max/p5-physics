let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
  Composite = Matter.Composite,
  Constraint = Matter.Constraint,
    Events = Matter.Events;

let engine;
let brushes = [];
let ball;
let obstacles = [];
let bumpers = [];
let flippers = [];
let drains = [];

let score = 0;
let lives = 3;
let gameOver = false;
let sensorButton;
let sensorStatus = 'Premi il pulsante e inclina il telefono';

let sensorInput = {
  beta: 0,
  gamma: 0,
  alpha: 0,
  baseBeta: 0,
  baseGamma: 0,
  active: false,
};

let smoothedGravityX = 0;
let smoothedGravityY = 0;
let smoothedTwist = 0;
let flipperPower = 1;

function normalizeTilt(value, maxAngle = 35, deadZone = 3) {
  const clamped = constrain(value, -maxAngle, maxAngle);

  if (abs(clamped) <= deadZone) {
    return 0;
  }

  const magnitude = map(abs(clamped), deadZone, maxAngle, 0, 1);
  return clamped < 0 ? -magnitude : magnitude;
}

function calibrateSensorBaseline(beta, gamma) {
  sensorInput.baseBeta = beta;
  sensorInput.baseGamma = gamma;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  engine.world.gravity.scale = 0.0012;

  ball = new Ball(width * 0.82, height * 0.78, 18);
  brushes = [ball];

  buildPlayfield();
  addWorldBodies();
  attachCollisionHandler();
  setupSensorListeners();
  createSensorButton();
  resetBall(true);
}

function draw() {
  updateSensorControls();
  updateFlippers();
  Engine.update(engine);

  background(11, 16, 31);
  drawBackdrop();

  for (let obstacle of obstacles) {
    obstacle.display();
  }

  for (let bumper of bumpers) {
    bumper.display();
  }

  for (let drain of drains) {
    drain.display();
  }

  for (let brush of brushes) {
    brush.display();
  }

  for (let flipper of flippers) {
    flipper.display();
  }

  drawHUD();

  if (gameOver) {
    drawGameOverOverlay();
  }
}

function buildPlayfield() {
  obstacles = [
    new Obstacle(width * 0.02, height * 0.5, 40, height, 0, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.98, height * 0.5, 40, height, 0, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.5, 20, width, 40, 0, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.16, height * 0.55, 18, height * 0.48, 0.12, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.84, height * 0.55, 18, height * 0.48, -0.12, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.22, height * 0.78, width * 0.28, 18, -0.42, { type: 'ramp', label: 'ramp' }),
    new Obstacle(width * 0.78, height * 0.74, width * 0.28, 18, 0.44, { type: 'ramp', label: 'ramp' }),
    new Obstacle(width * 0.28, height * 0.42, width * 0.2, 18, -0.25, { type: 'gate', label: 'wall' }),
    new Obstacle(width * 0.72, height * 0.42, width * 0.2, 18, 0.25, { type: 'gate', label: 'wall' }),
    new Obstacle(width * 0.5, height * 0.28, width * 0.12, 18, 0, { type: 'gate', label: 'wall' }),
    new Obstacle(width * 0.16, height * 0.95, width * 0.28, 30, 0, { type: 'wall', label: 'wall' }),
    new Obstacle(width * 0.84, height * 0.95, width * 0.28, 30, 0, { type: 'wall', label: 'wall' }),
  ];

  bumpers = [
    new Bumper(width * 0.5, height * 0.18, 28, { scoreValue: 250, color: color(255, 183, 3) }),
    new Bumper(width * 0.36, height * 0.31, 22, { scoreValue: 150, color: color(120, 210, 255) }),
    new Bumper(width * 0.64, height * 0.31, 22, { scoreValue: 150, color: color(251, 133, 0) }),
    new Bumper(width * 0.5, height * 0.44, 18, { scoreValue: 100, color: color(42, 157, 143) }),
  ];

  flippers = [
    new Flipper(width * 0.36, height * 0.87, 120, 'left', { color: color(244, 208, 111) }),
    new Flipper(width * 0.64, height * 0.87, 120, 'right', { color: color(244, 208, 111) }),
  ];

  drains = [
    new Drain(width * 0.5, height * 0.98, width * 0.24, 26),
  ];
}

function addWorldBodies() {
  const bodies = [];

  for (let obstacle of obstacles) {
    bodies.push(obstacle.body);
  }

  for (let bumper of bumpers) {
    bodies.push(bumper.body);
  }

  for (let flipper of flippers) {
    bodies.push(flipper.body);
    bodies.push(flipper.anchor);
    bodies.push(flipper.hinge);
  }

  for (let drain of drains) {
    bodies.push(drain.body);
  }

  bodies.push(ball.body);
  Composite.add(engine.world, bodies);
}

function attachCollisionHandler() {
  Events.on(engine, 'collisionStart', handleCollisionStart);
}

function handleCollisionStart(event) {
  for (let pair of event.pairs) {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;

    if (!ballBody) {
      continue;
    }

    const otherBody = ballBody === bodyA ? bodyB : bodyA;
    const otherObject = otherBody.gameObject;

    if (otherBody.label === 'bumper' && otherObject) {
      if (frameCount - otherObject.lastScoreFrame > 10) {
        otherObject.lastScoreFrame = frameCount;
        otherObject.pulse();
        score += otherObject.scoreValue;
        nudgeBallFromBody(ballBody, otherBody, 7.5);
      }
      continue;
    }

    if (otherBody.label === 'flipper' && otherObject) {
      otherObject.hitBall(ballBody, flipperPower * (otherObject.active ? 1 : 0.35));
      continue;
    }

    if (otherBody.label === 'ramp' && otherObject) {
      otherObject.pulse();
      const rampAngle = otherBody.angle;
      Body.setVelocity(ballBody, {
        x: ballBody.velocity.x + Math.cos(rampAngle) * 2.8,
        y: ballBody.velocity.y + Math.sin(rampAngle) * 2.8,
      });
      continue;
    }

    if (otherBody.label === 'wall' && otherObject) {
      otherObject.pulse();
      continue;
    }

    if (otherBody.label === 'drain') {
      handleDrainHit();
    }
  }
}

function nudgeBallFromBody(ballBody, sourceBody, strength) {
  const dx = ballBody.position.x - sourceBody.position.x;
  const dy = ballBody.position.y - sourceBody.position.y;
  const distance = Math.hypot(dx, dy) || 1;

  Body.setVelocity(ballBody, {
    x: ballBody.velocity.x + (dx / distance) * strength,
    y: ballBody.velocity.y + (dy / distance) * strength,
  });
}

function handleDrainHit() {
  if (gameOver) {
    return;
  }

  lives -= 1;

  if (lives <= 0) {
    lives = 0;
    gameOver = true;
    ball.reset(width * 0.5, height * 0.55);
    Body.setVelocity(ball.body, { x: 0, y: 0 });
    return;
  }

  resetBall(false);
}

function resetBall(initialLaunch = false) {
  ball.reset(width * 0.82, height * 0.74);

  const launchStrength = initialLaunch ? -5.2 : -4.4;
  Body.setVelocity(ball.body, {
    x: random(-0.8, 0.8),
    y: launchStrength,
  });
}

function restartGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  clearFlippers();
  resetBall(true);
}

function updateSensorControls() {
  const rawX = sensorInput.active ? sensorInput.beta : (typeof rotationX === 'number' ? rotationX : 0);
  const rawY = sensorInput.active ? sensorInput.gamma : (typeof rotationY === 'number' ? rotationY : 0);
  const rawZ = sensorInput.active ? sensorInput.alpha : (typeof rotationZ === 'number' ? rotationZ : 0);

  const deltaBeta = rawX - sensorInput.baseBeta;
  const deltaGamma = rawY - sensorInput.baseGamma;
  const tiltX = normalizeTilt(deltaGamma, 28, 1.5);
  const tiltY = normalizeTilt(deltaBeta, 28, 1.5);
  const targetGravityX = tiltX * 1.05;
  const targetGravityY = -tiltY * 1.05;
  const twist = map(constrain(rawZ, -180, 180), -180, 180, -PI, PI);

  smoothedGravityX = lerp(smoothedGravityX, targetGravityX, 0.08);
  smoothedGravityY = lerp(smoothedGravityY, targetGravityY, 0.08);
  smoothedTwist = lerp(smoothedTwist, twist, 0.12);

  engine.world.gravity.x = smoothedGravityX;
  engine.world.gravity.y = smoothedGravityY;

  flipperPower = map(abs(smoothedTwist), 0, PI / 2, 1.0, 1.35);

  if (!gameOver && ball && ball.body) {
    // rotationZ / alpha adds a very small sideways bias, useful on mobile to fine-tune the shot.
    const twistNudge = map(smoothedTwist, -PI, PI, -0.00032, 0.00032);
    if (abs(twistNudge) > 0.00001) {
      Body.applyForce(ball.body, ball.body.position, { x: twistNudge, y: 0 });
    }
  }
}

function setupSensorListeners() {
  let eventFireCount = 0;
  
  const handleOrientation = (event) => {
    eventFireCount++;
    if (eventFireCount === 1) {
      console.log('[SENSOR] First deviceorientation event received!', { 
        beta: event.beta, 
        gamma: event.gamma, 
        alpha: event.alpha 
      });
    }
    
    sensorInput.beta = typeof event.beta === 'number' ? event.beta : 0;
    sensorInput.gamma = typeof event.gamma === 'number' ? event.gamma : 0;
    sensorInput.alpha = typeof event.alpha === 'number' ? event.alpha : 0;
    sensorInput.active = true;

    if (!sensorInput.calibrated) {
      console.log('[SENSOR] Calibrating baseline:', { beta: sensorInput.beta, gamma: sensorInput.gamma });
      calibrateSensorBaseline(sensorInput.beta, sensorInput.gamma);
      sensorInput.calibrated = true;
    }
  };

  const handleMotion = (event) => {
    if (event.rotationRate && typeof event.rotationRate.alpha === 'number') {
      sensorInput.alpha = event.rotationRate.alpha;
      sensorInput.active = true;
    }
  };

  console.log('[SENSOR] Attaching event listeners...');
  window.addEventListener('deviceorientation', handleOrientation, true);
  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  window.addEventListener('devicemotion', handleMotion, true);
  console.log('[SENSOR] Event listeners attached');
}

function updateFlippers() {
  for (let flipper of flippers) {
    flipper.update(flipperPower);
  }
}

function drawBackdrop() {
  push();
  noStroke();
  fill(255, 255, 255, 16);
  rect(14, 14, width - 28, height - 28, 28);
  fill(12, 20, 38, 160);
  ellipse(width * 0.5, height * 0.1, width * 0.65, height * 0.18);
  ellipse(width * 0.5, height * 0.32, width * 0.9, height * 0.22);
  pop();
}

function drawHUD() {
  push();
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(max(16, width * 0.018));
  text('Punteggio: ' + score, 20, 62);
  text('Vite: ' + lives, 20, 88);

  textAlign(RIGHT, TOP);
  text('Tilt = gravita  Flipper = touch / frecce', width - 20, 62);
  text('rotationZ = spinta extra', width - 20, 88);

  textAlign(LEFT, TOP);
  text(sensorStatus, 20, 114);
  pop();
}

function drawGameOverOverlay() {
  push();
  fill(0, 180);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(max(30, width * 0.05));
  text('GAME OVER', width / 2, height * 0.43);
  textSize(max(18, width * 0.022));
  text('Tocca per ricominciare', width / 2, height * 0.52);
  pop();
}

function createSensorButton() {
  sensorButton = createButton('Richiedi accesso ai sensori');
  sensorButton.position(12, 12);
  sensorButton.style('z-index', '9999');
  sensorButton.style('touch-action', 'manipulation');
  sensorButton.style('pointer-events', 'auto');
  sensorButton.mousePressed(requestSensorAccess);
  sensorButton.touchStarted(() => {
    requestSensorAccess();
    return false;
  });
}

function requestSensorAccess() {
  if (typeof DeviceOrientationEvent === 'undefined') {
    sensorStatus = 'Questo browser non supporta i sensori di orientamento';
    console.error('[SENSOR] Browser non supporta DeviceOrientationEvent');
    return;
  }

  // Check if we're in a secure context (HTTPS or localhost)
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isFile = location.protocol === 'file:';
  
  if (!window.isSecureContext && !isLocalhost) {
    sensorStatus = 'Apri il gioco via HTTPS o localhost per usare i sensori';
    console.error('[SENSOR] Non secure context e non localhost:', { 
      isSecureContext: window.isSecureContext, 
      protocol: location.protocol,
      hostname: location.hostname 
    });
    return;
  }
  
  if (isFile) {
    sensorStatus = 'I sensori non funzionano con file:// - usa localhost o HTTPS';
    console.error('[SENSOR] File protocol detected');
    return;
  }

  const requests = [];

  console.log('[SENSOR] Starting permission requests...');
  console.log('[SENSOR] DeviceOrientationEvent.requestPermission exists?', typeof DeviceOrientationEvent.requestPermission === 'function');
  console.log('[SENSOR] DeviceMotionEvent.requestPermission exists?', typeof DeviceMotionEvent.requestPermission === 'function');

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    console.log('[SENSOR] Requesting DeviceOrientationEvent permission...');
    requests.push(
      DeviceOrientationEvent.requestPermission()
        .then(result => {
          console.log('[SENSOR] DeviceOrientation result:', result);
          return result;
        })
        .catch(error => {
          console.error('[SENSOR] DeviceOrientation error:', error);
          throw error;
        })
    );
  }

  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    console.log('[SENSOR] Requesting DeviceMotionEvent permission...');
    requests.push(
      DeviceMotionEvent.requestPermission()
        .then(result => {
          console.log('[SENSOR] DeviceMotion result:', result);
          return result;
        })
        .catch(error => {
          console.error('[SENSOR] DeviceMotion error:', error);
          throw error;
        })
    );
  }

  if (requests.length === 0) {
    console.log('[SENSOR] No requestPermission API, assuming sensors auto-granted');
    sensorInput.active = true;
    sensorInput.calibrated = false;
    setupSensorListeners();
    calibrateSensorBaseline(sensorInput.beta, sensorInput.gamma);
    sensorStatus = 'Sensori attivi';
    if (sensorButton) {
      sensorButton.remove();
      sensorButton = null;
    }
    return;
  }

  Promise.all(requests)
    .then((results) => {
      console.log('[SENSOR] All permissions resolved:', results);
      const denied = results.some((result) => result !== 'granted');

      if (denied) {
        sensorStatus = 'Permesso sensori negato dal browser';
        console.error('[SENSOR] Permission denied by user');
        return;
      }

      console.log('[SENSOR] All permissions granted! Setting up listeners...');
      sensorInput.active = true;
      sensorInput.calibrated = false;
      setupSensorListeners();
      calibrateSensorBaseline(sensorInput.beta, sensorInput.gamma);
      sensorStatus = 'Sensori attivi';
      if (sensorButton) {
        sensorButton.remove();
        sensorButton = null;
      }
    })
    .catch((error) => {
      sensorStatus = 'Errore nella richiesta dei sensori: ' + error.message;
      console.error('[SENSOR] Promise error:', error);
    });
}

function setFlippersFromPointer(xPosition) {
  if (gameOver) {
    restartGame();
    return;
  }

  const leftPressed = xPosition < width * 0.5;
  flippers[0].setActive(leftPressed);
  flippers[1].setActive(!leftPressed);
}

function clearFlippers() {
  for (let flipper of flippers) {
    flipper.setActive(false);
  }
}

function syncFlippersWithTouches() {
  let leftActive = false;
  let rightActive = false;

  for (let touch of touches) {
    if (touch.x < width * 0.5) {
      leftActive = true;
    } else {
      rightActive = true;
    }
  }

  flippers[0].setActive(leftActive);
  flippers[1].setActive(rightActive);
}

function touchStarted() {
  if (touches.length > 0) {
    if (gameOver) {
      restartGame();
      return false;
    }

    syncFlippersWithTouches();
  }

  return false;
}

function touchMoved() {
  if (gameOver) {
    return false;
  }

  syncFlippersWithTouches();
  return false;
}

function touchEnded() {
  if (touches.length > 0) {
    syncFlippersWithTouches();
  } else {
    clearFlippers();
  }
  return false;
}

function mousePressed() {
  setFlippersFromPointer(mouseX);
  return false;
}

function mouseReleased() {
  clearFlippers();
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    restartGame();
    return false;
  }

  if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') {
    flippers[0].setActive(true);
  }

  if (keyCode === RIGHT_ARROW || key === 'l' || key === 'L') {
    flippers[1].setActive(true);
  }

  return false;
}

function keyReleased() {
  if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') {
    flippers[0].setActive(false);
  }

  if (keyCode === RIGHT_ARROW || key === 'l' || key === 'L') {
    flippers[1].setActive(false);
  }

  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  Composite.clear(engine.world, false);
  buildPlayfield();
  addWorldBodies();
  resetBall(false);
}
