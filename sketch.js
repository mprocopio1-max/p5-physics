let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

let engine;
let brush;
let obstacle;
let brushes = [];

let NUM_BRUSHES = 100;


function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  
  for (let i = 0; i < NUM_BRUSHES; i++) {
    let size = random(10, 30);
    brush = new Brush(width / 2, height / 4, size);
    brushes.push(brush);
    Composite.add(engine.world, brush.body);
  }

  obstacle = new Obstacle(width /2, 600, 300, 50, PI / 6);
  

  Composite.add(engine.world, obstacle.body);

   let button = createButton('Request Sensor Access');

 button.position(10, 10);

 button.mousePressed(() => {

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {

   DeviceOrientationEvent.requestPermission().then(permissionState => {

    if (permissionState === 'granted') {

     console.log('Orientation permission granted');

    }

   }).catch(console.error);

  }

  if (typeof DeviceMotionEvent.requestPermission === 'function') {

   DeviceMotionEvent.requestPermission().then(permissionState => {

    if (permissionState === 'granted') {

     console.log('Motion permission granted');

    }

   }).catch(console.error);

  }

  button.remove();

 });

}

function draw() {
  background(220);
  
  for (let i= 0; i < brushes.length; i++) {
    brushes[i].display();
  }
  
  //console.log(rotationX, rotationY, rotationZ);
  
  let gravityX = map(rotationY, -PI, PI, -1, 1);
  engine.world.gravity.x = gravityX;
  
  let gravityY = map(rotationX, PI, -PI, 1, -1);
  engine.world.gravity.y = gravityY;

  
  obstacle.display();

  Engine.update(engine);
}  
