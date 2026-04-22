class Drain {
  constructor(x, y, width, height) {
    this.width = width;
    this.height = height;
    this.body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      friction: 0,
      restitution: 0,
      label: 'drain',
    });

    this.body.gameObject = this;
  }

  display() {
    push();
    translate(this.body.position.x, this.body.position.y);
    rectMode(CENTER);
    noFill();
    stroke(255, 110, 110, 150);
    strokeWeight(2);
    rect(0, 0, this.width, this.height, 8);
    line(-this.width * 0.38, 0, this.width * 0.38, 0);
    pop();
  }
}