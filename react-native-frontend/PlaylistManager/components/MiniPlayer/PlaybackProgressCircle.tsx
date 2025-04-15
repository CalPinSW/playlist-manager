import { FC } from "react"
import { useColorTheme } from "../../hooks/useColorTheme"
import CircularProgressBar from "./CircularProgressBar"

interface PlaybackProgressCircleProps {
    progress: number
}

const PlaybackProgressCircle: FC<PlaybackProgressCircleProps> = ({progress}) => {
    const theme = useColorTheme();
    const formatProgress = (number: number): string => {
        return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 }).format(
          number,
        );
      }
    return (
        <CircularProgressBar 
        radius={25} 
        strokeWidth={6} 
        progressLabel={{text: formatProgress(progress), color: theme.text.primary}}  
        progress={progress} 
        color={theme.primary.default} 
        emptyColor={theme.background.default}
      />
    )
}

export default PlaybackProgressCircle