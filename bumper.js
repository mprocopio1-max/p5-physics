class Bumper {
  constructor(x, y, radius = 24, options = {}) {
    this.radius = radius;
    this.scoreValue = options.scoreValue !== undefined ? options.scoreValue : 100;
    this.fillColor = options.color || color(255, 183, 3);
    this.strokeColor = options.strokeColor || color(255, 246, 210);
    this.flash = 0;
    this.lastScoreFrame = -999;

    // High restitution makes bumpers feel springy and rewarding.
    this.body = Bodies.circle(x, y, radius, {
      isStatic: true,
      restitution: 1.22,
      friction: 0.01,
      frictionAir: 0,
      density: 0.001,
      label: 'bumper',
    });

    this.body.gameObject = this;
  }

  pulse() {
    this.flash = 12;
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);

    noStroke();
    fill(this.fillColor);
    circle(0, 0, this.radius * 2.2);

    fill(255, 245, 210);
    circle(0, 0, this.radius * 1.2);

    if (this.flash > 0) {
      stroke(this.strokeColor);
      strokeWeight(3);
      noFill();
      circle(0, 0, this.radius * 2.8 + this.flash * 0.8);
      this.flash--;
    }

    pop();
  }
}