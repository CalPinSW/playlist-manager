import { Dimensions, View } from 'react-native';
import RnrCarousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window')

interface Props<T> {
    slidesPerPage: number
    data: T[] | undefined
    renderItem: (item: T) => JSX.Element
}

const Carousel = <T,>({slidesPerPage, data, renderItem}: Props<T>) => {
    return <RnrCarousel
          loop={false}
          overscrollEnabled={false}
          width={width / slidesPerPage}
          style={{width: width}}
          data={data ?? []}
          scrollAnimationDuration={500}
          renderItem={({ item, index }) => (
            <View
              style={{
                  display: "flex",
                  flex: 1,
                  margin: 2,
                }}
              nativeID={`slide ${index}`}
            >
              {renderItem(item)}
            </View>
          )}
        />
}

export default Carousel