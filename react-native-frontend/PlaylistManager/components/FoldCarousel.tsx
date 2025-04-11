import * as React from "react";
import { Button, Dimensions, ImageSourcePropType, StyleSheet, View, ViewStyle } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import type Animated from "react-native-reanimated";
import { AnimatedStyleProp, Extrapolation, interpolate } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";

import { SlideItem } from "@/components/SlideItem";
import { Playlist } from "../interfaces/Playlist";

const { width } = Dimensions.get('window')

interface Props {
    items: Playlist[]
}

export const  FoldCarousel: React.FC<Props> = ({items}) => {
  const itemSize = width / 2;
  const centerOffset = width / 2 - itemSize / 2;

  const dataLength = 18;

  const sideItemCount = 3;
  const sideItemWidth = (width - itemSize) / (2 * sideItemCount);

  const animationStyle: (value: number) => AnimatedStyleProp<ViewStyle> = React.useCallback(
    (value: number) => {
      "worklet";

      const itemOffsetInput = new Array(sideItemCount * 2 + 1)
        .fill(null)
        .map((_, index) => index - sideItemCount);

      const itemOffset = interpolate(
        value,
        // e.g. [0,1,2,3,4,5,6] -> [-3,-2,-1,0,1,2,3]
        itemOffsetInput,
        itemOffsetInput.map((item) => {
          if (item < 0) {
            return (-itemSize + sideItemWidth) * Math.abs(item);
          }

          if (item > 0) {
            return (itemSize - sideItemWidth) * (Math.abs(item) - 1);
          }

          return 0;
        }) as number[]
      );

      const translate =
        interpolate(value, [-1, 0, 1], [-itemSize, 0, itemSize]) + centerOffset - itemOffset;

      const width = interpolate(
        value,
        [-1, 0, 1],
        [sideItemWidth, itemSize, sideItemWidth],
        Extrapolation.CLAMP
      );

      return {
        transform: [
          {
            translateX: translate,
          },
        ],
        width,
        overflow: "hidden",
      };
    },
    [centerOffset, itemSize, sideItemWidth, sideItemCount]
  );

  return (
    <View style={{ flex: 1 }}>
        <Carousel
          width={itemSize}
          height={width / 2}
          style={{
            width: width,
            height: width / 2,
            backgroundColor: "black",
          }}
          windowSize={Math.round(dataLength / 2)}
          scrollAnimationDuration={500}
          data={items}
          renderItem={({ item, index, animationValue }) => (
            <Item animationValue={animationValue} index={index} key={index} source={{uri: item.image_url}} />
          )}
          customAnimation={animationStyle}
        />
    </View>
  );
}

const Item: React.FC<{
  index: number;
  animationValue: Animated.SharedValue<number>;
  source: ImageSourcePropType
}> = ({ index, source }) => {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        console.log(index);
      }}
      containerStyle={{ flex: 1 }}
      style={{ flex: 1 }}
    >
      <View
        style={{
          backgroundColor: "white",
          flex: 1,
          justifyContent: "center",
          overflow: "hidden",
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", height: "100%" }}>
          <SlideItem index={index} source={source}/>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
});

export default FoldCarousel;