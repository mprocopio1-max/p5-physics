const FlipperBodies = Matter.Bodies;
const FlipperBody = Matter.Body;
const FlipperConstraint = Matter.Constraint;

class Flipper {
  constructor(x, y, length, thickness, side = 'left') {
    this.x = x;
    this.y = y;
    this.length = length;
    this.thickness = thickness;
    this.side = side;
    this.direction = side === 'left' ? 1 : -1;

    const centerX = x + this.direction * length * 0.45;
    this.body = FlipperBodies.rectangle(centerX, y, length, thickness, {
      label: 'flipper',
      friction: 0.004,
      frictionAir: 0.001,
      restitution: 0.08,
      density: 0.006
    });

    this.pivot = FlipperConstraint.create({
      pointA: { x, y },
      bodyB: this.body,
      pointB: { x: -this.direction * length * 0.45, y: 0 },
      stiffness: 1,
      length: 0
    });

    this.restAngle = side === 'left' ? -0.28 : Math.PI + 0.28;
    this.activeAngle = side === 'left' ? -1.02 : Math.PI - 1.02;
    FlipperBody.setAngle(this.body, this.restAngle);

    this.color = side === 'left' ? color(238, 103, 88) : color(90, 169, 255);
  }

  update(isActive) {
    const target = isActive ? this.activeAngle : this.restAngle;
    const delta = target - this.body.angle;

    // Fast approach to target angle keeps flipper snappy without jitter.
    const speed = constrain(delta * 0.42, -0.45, 0.45);
    FlipperBody.setAngularVelocity(this.body, speed);
    FlipperBody.setAngle(this.body, this.body.angle + speed);
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);
    rectMode(CENTER);
    stroke(20, 30, 40);
    strokeWeight(2);
    fill(this.color);
    rect(0, 0, this.length, this.thickness, this.thickness * 0.5);
    pop();

    noStroke();
    fill(250);
    circle(this.x, this.y, this.thickness * 0.85);
  }
}
