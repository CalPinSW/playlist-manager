import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";

export const useColorTheme = () => {
    return Colors[useColorScheme() ?? 'light'];

};
