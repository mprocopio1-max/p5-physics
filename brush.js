class Brush {
  constructor(x, y, radius = 12, options = {}) {
    this.radius = radius;
    this.color = options.color || color(255, 230, 120);
    this.baseColor = this.color;
    this.hitFlashFrames = 0;

    this.body = Bodies.circle(x, y, radius, {
      label: options.label || 'ball',
      restitution: options.restitution ?? 0.35,
      friction: options.friction ?? 0.002,
      frictionAir: options.frictionAir ?? 0.002,
      density: options.density ?? 0.0022
    });
  }

  display() {
    this.keepInBounds();
    if (this.hitFlashFrames > 0) {
      this.hitFlashFrames -= 1;
      this.color = color(255, 255, 255);
    } else {
      this.color = this.baseColor;
    }

    noStroke();
    fill(this.color);
    circle(this.body.position.x, this.body.position.y, this.radius * 2);

    fill(255, 160);
    circle(this.body.position.x - this.radius * 0.35, this.body.position.y - this.radius * 0.35, this.radius * 0.6);
  }

  onCollision() {
    this.hitFlashFrames = 4;
  }

  boost(multiplier = 1.2) {
    const velocity = this.body.velocity;
    Body.setVelocity(this.body, {
      x: velocity.x * multiplier,
      y: velocity.y * multiplier
    });
    this.onCollision();
  }

  applyImpulse(forceX, forceY) {
    Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    this.onCollision();
  }

  reset(x, y) {
    Body.setPosition(this.body, { x, y });
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
    Body.setAngle(this.body, 0);
  }

  keepInBounds() {
    let pos = this.body.position;
    let r = this.radius;
        
       if (pos.x > width-r){
            Body.setPosition(this.body, { x: width-r, y: pos.y });
            Body.setVelocity(this.body, { x: 0, y: this.body.velocity.y });
        }
        if (pos.x < r){ 
            Body.setPosition(this.body, { x: r, y: pos.y });
            Body.setVelocity(this.body, { x: 0, y: this.body.velocity.y });         
        }
        if (pos.y > height-r){
            Body.setPosition(this.body, { x: pos.x, y: height-r });
            Body.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
        }
        if (pos.y < r){
            Body.setPosition(this.body, { x: pos.x, y: r });
            Body.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
        }
    }
}