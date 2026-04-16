class Obstacle {
  constructor(x, y, width = 300, height = 50, angle = PI / 6) {
    this.width = width;
    this.height = height;
    this.body = Bodies.rectangle(x, y, width, height);
    this.body.isStatic = true;
    Body.setAngle(this.body, angle);
  }

  display() {
    rectMode(CENTER);
    fill(0, 255, 0);
    
    push();
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);
    translate(-this.body.position.x, -this.body.position.y);
    rect(this.body.position.x, this.body.position.y, this.width, this.height);
    pop();
  }
}