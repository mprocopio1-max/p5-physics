class Flipper {
  constructor(pivotX, pivotY, length = 120, side = 'left', options = {}) {
    this.side = side;
    this.length = length;
    this.thickness = options.thickness !== undefined ? options.thickness : 24;
    this.active = false;
    this.flash = 0;
    this.fillColor = options.color || color(244, 208, 111);
    this.strokeColor = options.strokeColor || color(255, 248, 214);

    // The pivot stays fixed while the flipper swings around it.
    this.anchor = Bodies.circle(pivotX, pivotY, 4, {
      isStatic: true,
      isSensor: true,
      label: 'flipper_anchor',
    });
    this.anchor.gameObject = this;

    const centerOffset = this.side === 'left' ? -this.length * 0.5 : this.length * 0.5;
    this.body = Bodies.rectangle(pivotX + centerOffset, pivotY, this.length, this.thickness, {
      density: 0.0045,
      friction: 0.01,
      frictionStatic: 0.8,
      frictionAir: 0.02,
      restitution: 0.12,
      chamfer: { radius: this.thickness * 0.45 },
      label: 'flipper',
    });
    this.body.gameObject = this;

    this.hinge = Constraint.create({
      bodyA: this.anchor,
      pointA: { x: 0, y: 0 },
      bodyB: this.body,
      pointB: this.side === 'left' ? { x: this.length / 2, y: 0 } : { x: -this.length / 2, y: 0 },
      length: 0,
      stiffness: 1,
      damping: 0.08,
    });

    this.restAngle = this.side === 'left' ? -0.32 : PI + 0.32;
    this.activeAngle = this.side === 'left' ? -1.06 : PI + 1.06;
    Body.setAngle(this.body, this.restAngle);
  }

  setActive(active) {
    this.active = active;
  }

  update(power = 1) {
    const targetAngle = this.active ? this.activeAngle : this.restAngle;
    const error = targetAngle - this.body.angle;
    const desiredVelocity = constrain(error * 0.35, -0.55 * power, 0.55 * power);
    Body.setAngularVelocity(this.body, desiredVelocity);

    if (abs(error) < 0.02) {
      Body.setAngularVelocity(this.body, 0);
    }

    if (this.flash > 0) {
      this.flash--;
    }
  }

  hitBall(ballBody, power = 1) {
    const base = this.side === 'left' ? { x: 0.95, y: -1.1 } : { x: -0.95, y: -1.1 };
    const magnitude = Math.hypot(base.x, base.y) || 1;
    const impulse = 6 * power;

    Body.setVelocity(ballBody, {
      x: ballBody.velocity.x + (base.x / magnitude) * impulse,
      y: ballBody.velocity.y + (base.y / magnitude) * impulse,
    });

    Body.setAngularVelocity(ballBody, ballBody.angularVelocity * 0.4);
    this.flash = 8;
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    rectMode(CENTER);
    noStroke();
    fill(this.fillColor);
    rect(0, 0, this.length, this.thickness, this.thickness / 2);

    fill(255, 255, 255, 120);
    rect(this.side === 'left' ? this.length * 0.15 : -this.length * 0.15, 0, this.length * 0.35, this.thickness * 0.5, this.thickness / 2);

    stroke(this.strokeColor);
    strokeWeight(2);
    noFill();
    rect(0, 0, this.length - 4, this.thickness - 4, this.thickness / 2);

    if (this.flash > 0) {
      stroke(255, 255, 255, 180);
      strokeWeight(3);
      line(-this.length * 0.45, 0, this.length * 0.45, 0);
    }

    pop();
  }
}