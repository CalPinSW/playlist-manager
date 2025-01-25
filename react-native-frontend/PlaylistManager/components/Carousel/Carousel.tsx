import React, { FC } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import Carousel from "react-native-reanimated-carousel";

interface SlideProps {
  children: React.ReactNode;
}

const Slide: FC<SlideProps> = ({ children }) => {
  return <View style={{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // Optional: for debugging
    borderRadius: 10, // Optional: make it look better
    marginHorizontal: 10, // Add spacing between slides
    overflow: "hidden",
  }}
>{children}</View>;
};

interface CarouselProps {
  slides: React.ReactNode[];
  startIndex?: number;
}

const CustomCarousel: FC<CarouselProps> = ({ slides, startIndex = 0 }) => {
  const { width } = Dimensions.get("window");
  console.log(slides)
  return (
    <Carousel
      loop // Enable infinite scrolling
      width={width} // Set the width of each slide
      height={width * 0.6} // Adjust the height to fit the content
      data={slides}
      defaultIndex={startIndex} // Start at a specific index
      scrollAnimationDuration={1000} // Smooth scrolling
      renderItem={({ item }) => (
        <Slide>
          {item}
        </Slide>)
      }
    />
  );
};

const styles = StyleSheet.create({

});

export default CustomCarousel;
