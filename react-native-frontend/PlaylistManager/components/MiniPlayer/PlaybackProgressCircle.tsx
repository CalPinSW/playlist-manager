import { FC } from "react"
import { useColorTheme } from "../../hooks/useColorTheme"
import CircularProgressBar from "./CircularProgressBar"

interface PlaybackProgressCircleProps {
    progress: number;
    animation?: {duration: number};
}

const PlaybackProgressCircle: FC<PlaybackProgressCircleProps> = ({progress, animation}) => {
    const theme = useColorTheme();
    const formatProgress = (number: number): string => {
        return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 }).format(
          number,
        );
      }
    const cAnimation = animation ? {duration: animation.duration, color: theme.primary.lighter} : undefined
    return (
      <CircularProgressBar 
        radius={25} 
        strokeWidth={4} 
        progressLabel={{text: formatProgress(progress), color: theme.text.primary}}  
        progress={progress} 
        color={theme.primary.default} 
        emptyColor={theme.background.default}
        animation={cAnimation}
      />
    )
}

export default PlaybackProgressCircle;
