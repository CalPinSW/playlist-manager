import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Path, Defs, ClipPath, Rect, G, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps{
  viewStyle?: StyleProp<ViewStyle>
}

const ArtistIcon: React.FC<IconProps> = ({viewStyle, ...props}) => {
  return (
    <View style={[viewStyle]}>
      <Svg viewBox="0 0 24 25" width={24} height={25} {...props}>
        <Defs>
          <ClipPath id="clip0">
            <Rect width="24" height="24" fill="none" />
          </ClipPath>
        </Defs>
        <G fill="currentColor" clipPath="url(#clip0)">
          <Circle cx="12" cy="7" r="3" strokeWidth="2.5" />
          <Circle
            cx="18"
            cy="18"
            r="2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12.3414 20H6C4.89543 20 4 19.1046 4 18C4 15.7909 5.79086 14 8 14H13.5278"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 18V11L22 13"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </View>
  );
};

export default ArtistIcon;
