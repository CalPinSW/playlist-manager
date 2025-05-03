import { Dimensions, View } from 'react-native';
import RnrCarousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window')

interface Props<T> {
    slidesPerPage: number
    data: T[] | undefined
    renderItem: (item: T) => JSX.Element
    forwardRef?: React.Ref<ICarouselInstance>
}

const Carousel = <T,>({slidesPerPage, data, renderItem, forwardRef}: Props<T>) => {
    return <RnrCarousel
          ref={forwardRef}
          loop={false}
          overscrollEnabled={true}
          width={width / slidesPerPage}
          style={{width: width, height: 250}}
          data={data ?? []}
          renderItem={({ item, index }) => (
            <View
              style={{
                  display: "flex",
                  margin: 2,
                }}
              nativeID={`slide ${index}`}
            >
              {renderItem(item)}
            </View>
          )}
        />
}

export default Carousel;
