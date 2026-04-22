class Ball {
  constructor(x, y, radius = 18) {
    this.radius = radius;
    this.spawn = { x, y };

    // A pinball needs low air drag and a lively restitution, but not a perfect bounce.
    this.body = Bodies.circle(x, y, radius, {
      restitution: 0.92,
      friction: 0.01,
      frictionAir: 0.002,
      density: 0.0015,
    });

    this.body.label = 'ball';
    this.body.gameObject = this;
    this.baseColor = color(245);
    this.highlightColor = color(120, 210, 255);
  }

  reset(x = this.spawn.x, y = this.spawn.y) {
    this.spawn = { x, y };
    Body.setPosition(this.body, this.spawn);
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngle(this.body, 0);
    Body.setAngularVelocity(this.body, 0);
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    noStroke();
    fill(this.baseColor);
    circle(0, 0, this.radius * 2);

    fill(255, 140);
    circle(-this.radius * 0.25, -this.radius * 0.25, this.radius * 0.9);

    noFill();
    stroke(this.highlightColor);
    strokeWeight(2);
    circle(0, 0, this.radius * 1.7);

    pop();
  }
}

// Compatibility layer: the original project used Brush, so keep the name alive.
class Brush extends Ball {}