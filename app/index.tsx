import { BrickInterface, CircleInterface, PaddleInterface } from "@/types";
import {
  Canvas,
  Circle,
  LinearGradient,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Button } from 'react-native';
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import {
  BALL_COLOR,
  BRICK_HEIGHT,
  BRICK_MIDDLE,
  BRICK_ROW_LENGTH,
  BRICK_WIDTH,
  height,
  PADDLE_HEIGHT,
  PADDLE_MIDDLE,
  PADDLE_WIDTH,
  RADIUS,
  TOTAL_BRICKS,
  width,
} from "../constants";
import { animate, createBouncingExample } from "@/logic";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

// Import Updates from expo-updates
import * as Updates from 'expo-updates';

interface Props {
  id: number;
  brick: BrickInterface;
}

const Brick = ({ id, brick }: Props) => {
  const color = useDerivedValue(() => {
    return brick.canCollide.value ? "orange" : "transparent";
  }, [brick.canCollide]);

  return (
    <RoundedRect
      x={brick.x}
      y={brick.y}
      width={brick.width}
      height={brick.height}
      color={color}
      r={8}
    >
      <LinearGradient
        start={vec(0, 300)}
        end={vec(brick.width, brick.height)}
        colors={["red", "orange"]}
      />
    </RoundedRect>
  );
};

function index() {
  const [gameOver, setGameOver] = useState(false);
  const remainingBricks = useSharedValue(TOTAL_BRICKS);

  const handleGameOver = () => {
    setGameOver(true); // This stops the game UI but not the frame callback
  };

  const handleReload = async () => {
    try {
      if (__DEV__) {
        console.log("Reloading in development mode does not use expo-updates.");
      } else {
        console.log("Attempting to reload the app...");
        await Updates.reloadAsync();
        console.log("App should be reloading...");
      }
    } catch (error) {
      console.error("Error reloading app:", error);
    }
  };
  
  

  const circleObject: CircleInterface = {
    id: 0,
    type: "Circle",
    x: useSharedValue(100),
    y: useSharedValue(450),
    r: RADIUS,
    ax: 0,
    ay: 0,
    vx: 0,
    vy: 0,
  };

  const rectangleObject: PaddleInterface = {
    type: "Paddle",
    id: 0,
    x: useSharedValue(PADDLE_MIDDLE),
    y: useSharedValue(height - 100),
    ax: 0,
    ay: 0,
    vx: 0,
    vy: 0,
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
  };

  createBouncingExample(circleObject);

  const bricks: BrickInterface[] = Array(TOTAL_BRICKS)
    .fill(0)
    .map((_, id) => {
      const farBrickX = BRICK_MIDDLE + BRICK_WIDTH + 50;
      const middleBrickX = BRICK_MIDDLE;
      const closeBrickX = BRICK_MIDDLE - BRICK_WIDTH - 50;
      const startingy = 60;
      const ySpacing = 45;

      let startingXPosition = -1;

      if (id % BRICK_ROW_LENGTH === 0) {
        startingXPosition = farBrickX;
      } else if (id % BRICK_ROW_LENGTH === 1) {
        startingXPosition = middleBrickX;
      } else if (id % BRICK_ROW_LENGTH === 2) {
        startingXPosition = closeBrickX;
      }

      const startingYposition =
        startingy + ySpacing * Math.floor(id / BRICK_ROW_LENGTH);

      return {
        type: "Brick",
        id,
        x: useSharedValue(startingXPosition),
        y: useSharedValue(startingYposition),
        ax: 0,
        ay: 0,
        vx: 0,
        vy: 0,
        height: BRICK_HEIGHT,
        width: BRICK_WIDTH,
        canCollide: useSharedValue(true),
      };
    });

    // const handleReload = async () => {
    //     console.log('Reloading app...');
    //     await Updates.reloadAsync(); // Reload the app
    //   };

  useFrameCallback((frameInfo) => {
    if (gameOver || !frameInfo.timeSincePreviousFrame) {
      return; // Skip updates if the game is over
    }

    animate([circleObject, rectangleObject, ...bricks], frameInfo.timeSincePreviousFrame, 0);

    bricks.forEach((brick) => {
      if (brick.canCollide.value) {
        // Detect brick collision
        brick.canCollide.value = false;
        remainingBricks.value -= 1;

        // Check if all bricks are gone
        if (remainingBricks.value === 0) {
          runOnJS(handleGameOver)(); // Call the React state updater safely
        }
      }
    });
  });

  const gesture = Gesture.Pan().onChange(({ x }) => {
    rectangleObject.x.value = x - PADDLE_WIDTH / 2;
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <View style={styles.container}>
          <Canvas style={{ flex: 1 }}>
            <Circle
              cx={circleObject.x}
              cy={circleObject.y}
              r={RADIUS}
              color={BALL_COLOR}
            />
            <RoundedRect
              x={rectangleObject.x}
              y={rectangleObject.y}
              width={rectangleObject.width}
              height={rectangleObject.height}
              color={"white"}
              r={8}
            />
            {bricks.map((brick, index) => {
              return <Brick key={index} id={index} brick={brick} />;
            })}
          </Canvas>
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>Game Over</Text>
              {/* <TouchableOpacity style={styles.startAgainButton} onPress={resetGame}>
              onPress={handleReload}
                <Text style={styles.startAgainText}>Start Again</Text>
              </TouchableOpacity> */}
              <Button title="Reload App" onPress={handleReload} />;
            </View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  gameOverText: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
  },
  startAgainButton: {
    backgroundColor: "orange",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startAgainText: {
    color: "white",
    fontSize: 20,
  },
});
