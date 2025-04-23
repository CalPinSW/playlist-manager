import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface CircularProgressBarProps {
  radius: number;
  strokeWidth: number;
  progress: number; // Should be a value between 0 and 1
  color: string;
  emptyColor?: string;
  progressLabel?: {text: string; color: string;}
  animation?: {color: string, duration: number}
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  radius,
  strokeWidth,
  progress,
  color,
  emptyColor,
  progressLabel,
  animation
}) => {
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = circumference * (1 - progress) + 2 * strokeWidth;

  const animatedStrokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    if (animation) {
      animatedStrokeDashoffset.value = withRepeat(
          withTiming(
            strokeDashoffset, 
            { duration: animation.duration, easing: Easing.bezier(0.7, 0.1, 0.25, 1)}
          ), 
          -1
        );
    }
    return () => {
      cancelAnimation(animatedStrokeDashoffset);
      animatedStrokeDashoffset.set(circumference);
    }
  }, [animation, circumference, progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: animatedStrokeDashoffset.value,
    };
  });
  
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  return (
    <View style={{ aspectRatio: 1, width: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2}>
      { // Empty Circle that the progress bar fills
        emptyColor && 
            <Circle
                stroke={emptyColor}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={0}
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
            />
        }
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`0 ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
        />
        {/* Ensures base of progress bar is not rounded */}
        <Circle 
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
        />
        {
          animation && 
            <AnimatedCircle
              animatedProps={animatedProps}
              stroke={animation.color}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeLinecap="butt"
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
            />
        }
        {progressLabel && 
            <SvgText
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={radius / 2.5}
                fill={progressLabel.color}
                fontWeight="bold"
            >
                {progressLabel.text}
            </SvgText>
        }
      </Svg>
    </View>
  );
};

export default CircularProgressBar;
