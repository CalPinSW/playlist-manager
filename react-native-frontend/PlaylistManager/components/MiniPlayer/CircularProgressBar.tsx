import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface CircularProgressBarProps {
  radius: number;
  strokeWidth: number;
  progress: number; // Should be a value between 0 and 1
  color: string;
  emptyColor?: string;
  progressLabel?: {text: string; color: string;}
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  radius,
  strokeWidth,
  progress,
  color,
  emptyColor,
  progressLabel,
}) => {
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    const circumferenceValue = 2 * Math.PI * radius;
    setCircumference(circumferenceValue);
  }, [radius]);

  const strokeDashoffset = circumference * (1 - progress);
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
