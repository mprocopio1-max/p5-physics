class Obstacle {
  constructor(x, y, width = 300, height = 50, angle = 0, options = {}) {
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.shape = options.shape || 'rectangle';
    this.color = options.color || color(70, 90, 120);
    this.strokeColor = options.strokeColor || color(15, 25, 35);
    this.label = options.label || 'obstacle';
    this.isSensor = options.isSensor || false;

    const bodyOptions = {
      isStatic: options.isStatic ?? true,
      isSensor: this.isSensor,
      label: this.label,
      restitution: options.restitution ?? 0.25,
      friction: options.friction ?? 0.03,
      frictionStatic: options.frictionStatic ?? 0.4,
      frictionAir: options.frictionAir ?? 0,
      density: options.density ?? 0.001
    };

    if (this.shape === 'circle') {
      this.radius = options.radius || width * 0.5;
      this.body = Bodies.circle(x, y, this.radius, bodyOptions);
    } else {
      this.body = Bodies.rectangle(x, y, width, height, bodyOptions);
      Body.setAngle(this.body, angle);
    }

    this.body.plugin = {
      kind: this.label,
      gameplay: options.gameplay || this.label
    };
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    stroke(this.strokeColor);
    strokeWeight(this.isSensor ? 1.5 : 2);
    fill(this.color);

    if (this.shape === 'circle') {
      circle(0, 0, this.radius * 2);
      stroke(255, 180);
      line(-this.radius * 0.5, -this.radius * 0.5, this.radius * 0.5, this.radius * 0.5);
    } else {
      rectMode(CENTER);
      rect(0, 0, this.width, this.height, 8);
    }

    pop();
  }
}