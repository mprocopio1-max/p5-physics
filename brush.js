const BrushBodies = Matter.Bodies;
const BrushBody = Matter.Body;

class Brush {
  constructor(x, y, radius = 12, options = {}) {
    this.radius = radius;
    this.color = options.color || color(255, 230, 120);
    this.baseColor = this.color;
    this.hitFlashFrames = 0;

    this.body = BrushBodies.circle(x, y, radius, {
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
    BrushBody.setVelocity(this.body, {
      x: velocity.x * multiplier,
      y: velocity.y * multiplier
    });
    this.onCollision();
  }

  applyImpulse(forceX, forceY) {
    BrushBody.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
    this.onCollision();
  }

  reset(x, y) {
    BrushBody.setPosition(this.body, { x, y });
    BrushBody.setVelocity(this.body, { x: 0, y: 0 });
    BrushBody.setAngularVelocity(this.body, 0);
    BrushBody.setAngle(this.body, 0);
  }

  keepInBounds() {
    let pos = this.body.position;
    let r = this.radius;
        
       if (pos.x > width-r){
            BrushBody.setPosition(this.body, { x: width-r, y: pos.y });
            BrushBody.setVelocity(this.body, { x: 0, y: this.body.velocity.y });
        }
        if (pos.x < r){ 
            BrushBody.setPosition(this.body, { x: r, y: pos.y });
            BrushBody.setVelocity(this.body, { x: 0, y: this.body.velocity.y });         
        }
        if (pos.y > height-r){
            BrushBody.setPosition(this.body, { x: pos.x, y: height-r });
            BrushBody.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
        }
        if (pos.y < r){
            BrushBody.setPosition(this.body, { x: pos.x, y: r });
            BrushBody.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
        }
    }
}