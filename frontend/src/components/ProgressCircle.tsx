import React, { FC } from "react";

interface ProgressCircleProps {
  percentage: number;
  className?: string;
}
export const ProgressCircle: FC<ProgressCircleProps> = ({
  percentage,
  className,
}) => {
  return (
    <div className="relative">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 stroke-current"
          stroke-width="10"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
        ></circle>
        <circle
          className="text-indigo-500  progress-ring__circle stroke-current"
          stroke-width="10"
          stroke-linecap="round"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          stroke-dasharray={40 * 2 * Math.PI}
          stroke-dashoffset={
            40 * 2 * Math.PI - (percentage / 100) * 40 * 2 * Math.PI
          }
        ></circle>

        <text
          x="50"
          y="50"
          font-family="Verdana"
          font-size="12"
          text-anchor="middle"
          alignment-baseline="middle"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
};
