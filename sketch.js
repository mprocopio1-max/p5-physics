let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

let engine;
let brush;
let obstacle; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();

  brush = Bodies.circle(width/2, height/4, 50);
  obstacle = Bodies.rectangle(width/2, 600, 300, 50);
  obstacle.isStatic = true;

  Composite.add(engine.world, obstacle);
  Composite.add(engine.world, brush);

}

function draw() {
  background(220);

  noStroke();
  fill(255, 0, 0);
  circle (brush.position.x, brush.position.y, brush.circleRadius * 2 );


  rectMode(CENTER);
  fill(0, 255, 0);
  rect(obstacle.position.x, obstacle.position.y, 300, 50);  
  Engine.update(engine);
}
