function obstaclePalette(type) {
  if (type === 'ramp') {
    return {
      fill: color(122, 92, 72),
      stroke: color(255, 220, 170),
    };
  }

  if (type === 'gate') {
    return {
      fill: color(54, 78, 104),
      stroke: color(184, 214, 237),
    };
  }

  return {
    fill: color(34, 52, 70),
    stroke: color(180, 215, 255),
  };
}

class Obstacle {
  constructor(x, y, width = 300, height = 50, angle = 0, options = {}) {
    this.width = width;
    this.height = height;
    this.type = options.type || 'wall';
    this.label = options.label || this.type;
    this.flash = 0;

    const palette = obstaclePalette(this.type);
    this.fillColor = options.color || palette.fill;
    this.strokeColor = options.strokeColor || palette.stroke;

    this.body = Bodies.rectangle(x, y, width, height, {
      isStatic: options.isStatic !== undefined ? options.isStatic : true,
      isSensor: options.isSensor || false,
      restitution: options.restitution !== undefined ? options.restitution : (this.type === 'ramp' ? 0.14 : 0.06),
      friction: options.friction !== undefined ? options.friction : (this.type === 'ramp' ? 0.08 : 0.2),
      frictionStatic: options.frictionStatic !== undefined ? options.frictionStatic : 0.6,
      density: options.density !== undefined ? options.density : 0.001,
      chamfer: options.chamfer || { radius: Math.min(14, height / 2) },
    });

    Body.setAngle(this.body, angle);
    this.body.label = this.label;
    this.body.gameObject = this;
  }

  pulse() {
    this.flash = 10;
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    rectMode(CENTER);
    noStroke();

    const alphaBoost = this.flash > 0 ? 40 : 0;
    fill(red(this.fillColor) + alphaBoost, green(this.fillColor) + alphaBoost, blue(this.fillColor) + alphaBoost);
    rect(0, 0, this.width, this.height, Math.min(14, this.height / 2));

    stroke(this.strokeColor);
    strokeWeight(2);
    noFill();
    rect(0, 0, this.width - 4, this.height - 4, Math.min(12, this.height / 2));

    if (this.type === 'ramp') {
      stroke(255, 240, 210, 110);
      strokeWeight(1.5);
      line(-this.width * 0.32, -this.height * 0.1, this.width * 0.32, this.height * 0.1);
      line(-this.width * 0.18, -this.height * 0.25, this.width * 0.46, -this.height * 0.05);
    }

    if (this.flash > 0) {
      this.flash--;
    }

    pop();
  }
}