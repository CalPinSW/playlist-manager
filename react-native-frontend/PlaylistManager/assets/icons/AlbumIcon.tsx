import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps{
  viewStyle?: StyleProp<ViewStyle>
}

const AlbumIcon: React.FC<IconProps> = ({viewStyle, ...props}) => {
  return (
    <View style={[viewStyle]}>
      <Svg viewBox="0 0 24 24" width={24} height={24} strokeWidth={1.5} {...props}>
        <Path
          d="M15 2.20001C19.5645 3.12655 23 7.16206 23 12C23 16.8379 19.5645 20.8734 15 21.7999"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M15 9C16.1411 9.28364 17 10.519 17 12C17 13.481 16.1411 14.7164 15 15"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1 2L11 2L11 22L1 22"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4 15.5C4 16.3284 3.32843 17 2.5 17C1.67157 17 1 16.3284 1 15.5C1 14.6716 1.67157 14 2.5 14C3.32843 14 4 14.6716 4 15.5ZM4 15.5V7.6C4 7.26863 4.26863 7 4.6 7H7"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export default AlbumIcon;
