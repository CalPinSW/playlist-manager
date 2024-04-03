import React, { FC } from "react";

interface ProgressCircleProps {
  percentage: number;
  className?: string;
}
export const ProgressCircle: FC<ProgressCircleProps> = ({
  percentage,
  className,
}) => {
  const strokeDashOffset = (1 - percentage) * 0.96;
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 stroke-current"
          strokeWidth="10"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
        ></circle>
        <circle
          className="text-indigo-500  progress-ring__circle stroke-current"
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeDasharray={40 * 2 * Math.PI}
          strokeDashoffset={
            40 * 2 * Math.PI - (percentage / 100) * 40 * 2 * Math.PI
          }
        ></circle>

        <text
          x="50"
          y="50"
          fontFamily="Verdana"
          fontSize="12"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
};
