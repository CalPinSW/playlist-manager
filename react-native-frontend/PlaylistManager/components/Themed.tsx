import { Text as DefaultText, View as DefaultView, TextInput as DefaultTextInput } from 'react-native';
import { useColorTheme } from '../hooks/useColorTheme';

export type TextProps = {noBackground?: boolean} & DefaultText['props'];
export type TextInputProps = DefaultTextInput['props'];
export type ViewProps = {noBackground?: boolean} & DefaultView['props'];

export function Text(props: TextProps) {
  const { style, noBackground, ...otherProps } = props;
  const theme = useColorTheme();

  const backgroundColor = noBackground ? undefined :  theme.background.offset;

  return <DefaultText 
    style={[
      { 
        color: theme.text.primary, 
        backgroundColor,
        borderRadius: 5
      }, style]} {...otherProps} />;
}

export function TextInput (props: TextInputProps) {
  const { style, ...otherProps } = props;
  const theme = useColorTheme();

  return <DefaultTextInput 
        style={[
          { 
            color: theme.text.primary, 
            backgroundColor: theme.background.offset,
            borderColor: theme.primary.default,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 0,
            borderRadius: 5
          }, style]} {...otherProps} />
}

export function View(props: ViewProps) {
  const { style, noBackground, ...otherProps } = props;
  const theme = useColorTheme();

  const backgroundColor = noBackground ? undefined :  theme.background.default;

  return <DefaultView style={[{ backgroundColor: backgroundColor }, style]} {...otherProps} />;
}
