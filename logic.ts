import { SharedValue } from "react-native-reanimated"
import { height, MAX_SPEED, PADDLE_HEIGHT, PADDLE_WIDTH, RADIUS, width } from "./constants"
import { CircleInterface, PaddleInterface, ShapeInteface,Collision, BrickInterface } from "./types"
import { runOnJS } from "react-native-reanimated";
export const createBouncingExample = (circleObject: CircleInterface) =>{
    "worklet"

    circleObject.x.value = 100,
    circleObject.y.value = 450,
    circleObject.r = RADIUS,
    circleObject.ax = 0.5,
    circleObject.ay = 1,
    circleObject.vx = 0,
    circleObject.vy = 0
}
const move = (object: ShapeInteface, dt:number) =>{
    "worklet";

    object.vx += object.ax*dt;
    object.vy += object.ay*dt;

    if(object.vx > MAX_SPEED){
        object.vx = MAX_SPEED
    }

    if(object.vx < -MAX_SPEED){
        object.vx = -MAX_SPEED
    }

    if(object.vy > MAX_SPEED){
        object.vy = MAX_SPEED
    }

    if(object.vy < -MAX_SPEED){
        object.vy = -MAX_SPEED
    }

    object.x.value +=object.vx*dt;
    object.y.value +=object.vy*dt;

}


export const resolveWallCollisions = (object: ShapeInteface) =>{
    "worklet";

    const circleObject =  object as CircleInterface

    // Check if it connected with wall
    // Right wall collision
    if(circleObject.x.value + circleObject.r > width){
        circleObject.x.value = width - circleObject.r * 2;
        circleObject.vx = -circleObject.vx;
        circleObject.ax = -circleObject.ax;
    }

    // Bottom wall collision
    else if(circleObject.y.value + circleObject.r > height){
        circleObject.y.value = height - circleObject.r * 2;
        circleObject.vy = -circleObject.vy;
        circleObject.ay = -circleObject.ay;
    }


    // Left wall collision
    else if(circleObject.x.value - circleObject.r < 0){
        circleObject.x.value = circleObject.r * 2;
        circleObject.vx = -circleObject.vx;
        circleObject.ax = -circleObject.ax;
    }

    // Top wall collision
    else if(circleObject.y.value - circleObject.r < 0){
        circleObject.y.value = circleObject.r;
        circleObject.vy = -circleObject.vy;
        circleObject.ay = -circleObject.ay;
    }
}

function circleRect(
    cx:number,
    cy:number,
    rx:number,
    ry:number,
    rw:number,
    rh:number
){
    "worklet"

    let testX=cx;
    let testY=cy

   // which edge is closest?
  if (cx < rx)         testX = rx;      // test left edge
  else if (cx > rx+rw) testX = rx+rw;   // right edge
  if (cy < ry)         testY = ry;      // top edge
  else if (cy > ry+rh) testY = ry+rh;   // bottom edge

  // get distance from closest edges
  let distX = cx-testX;
  let distY = cy-testY;
  let distance = Math.sqrt( (distX*distX) + (distY*distY) );

  // if the distance is less than the radius, collision!
  if (distance <= RADIUS) {
    return true;
  }
  return false;
    
}

export const checkCollision = (o1: ShapeInteface, o2: ShapeInteface) => {
    "worklet";
  
    if (o1.type === "Circle" && (o2.type === "Paddle" || o2.type === "Brick")) {
      if (o2.type === "Brick") {
        const brick = o2 as BrickInterface;
  
        // If the brick cannot collide, skip
        if (!brick.canCollide.value) {
          return {
            collisionInfo: null,
            collided: false,
          };
        }
      }
  
      const circleObject = o1 as CircleInterface;
      const rectangleObject = o2 as PaddleInterface;
  
      const isCollision = circleRect(
        circleObject.x.value,
        circleObject.y.value,
        rectangleObject.x.value,
        rectangleObject.y.value,
        rectangleObject.width,
        rectangleObject.height
      );
  
      if (isCollision) {
        if (o2.type === "Brick") {
          const brick = o2 as BrickInterface;
  
          // Set canCollide to false to ensure only one collision
          brick.canCollide.value = false;
        }
        const d = Math.sqrt(Math.pow(rectangleObject.x.value - circleObject.x.value, 2) + Math.pow(rectangleObject.y.value - circleObject.y.value, 2));
        return {
          collisionInfo: {
            o1,
            o2,
            dx: rectangleObject.x.value - circleObject.x.value,
            dy: rectangleObject.y.value - circleObject.y.value,
            d
          },
          collided: true,
        };
      }
    }
  
    return {
      collisionInfo: null,
      collided: false,
    };
  };
  

export const resolveCollisionWithBounce = (info: Collision) =>{
    "worklet";
    const circleInfo=info.o1 as CircleInterface;

    circleInfo.y.value = circleInfo.y.value - circleInfo.r;

     circleInfo.vy = -circleInfo.vy
     circleInfo.ay = -circleInfo.ay

}
export const animate = (
    objects: ShapeInteface[],
    timeSincePreviousFrame: number,
    remainingBricks: number
  ) => {
    "worklet";
  
    for (const o of objects) {
      if (o.type === "Circle") {
        move(o, (0.15 / 16) * timeSincePreviousFrame);
      }
    }
  
    for (const o of objects) {
      if (o.type === "Circle") {
        resolveWallCollisions(o);
      }
    }
  
    const collisions: Collision[] = [];
  
    for (const [i, o1] of objects.entries()) {
      if (o1.type === "Circle") {
        for (const o2 of objects) {
          if (o1 !== o2) {
            const { collided, collisionInfo } = checkCollision(o1, o2);
            if (collided && collisionInfo) {
              collisions.push(collisionInfo);
  
              if (o2.type === "Brick") {
                const brick = o2 as BrickInterface;
  
                // Decrement remainingBricks when a brick is destroyed
                if (brick.canCollide.value) {
                  brick.canCollide.value = false;
                }
              }
              break;
            }
          }
        }
      }
    }
  
    for (const col of collisions) {
      resolveCollisionWithBounce(col);
    }
  };
  