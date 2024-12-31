import { SharedValue} from "react-native-reanimated"; 

type SharedVariant = "Circle" | "Paddle" | "Brick";

export interface ShapeInteface{
    x:SharedValue<number>
    y:SharedValue<number>
    ax:number,
    ay:number,
    vx:number,
    vy:number,
    type:SharedVariant,
    id:number
}

export interface CircleInterface extends ShapeInteface{
    r:number,
}

export interface PaddleInterface extends ShapeInteface{
    type:"Paddle",
    height:number,
    width:number,
}

export interface Collision{
    o1:ShapeInteface,
    o2:ShapeInteface,
    dx:number,
    dy:number,
    d:number
}

export interface BrickInterface extends ShapeInteface{
    type:"Brick",
    height:number,
    width: number,
    canCollide: SharedValue<boolean>,
    
}