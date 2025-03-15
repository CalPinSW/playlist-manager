import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash"
import { TextInput } from "./Themed";
import { StyleProp, TextStyle } from "react-native";

interface DebouncedTextInputProps {
    value: string;
    onChange: Dispatch<SetStateAction<string>>;
    style?: StyleProp<TextStyle>
}

export const DebouncedTextInput: FC<DebouncedTextInputProps> = ({value, onChange, style}) => {
    const [displayValue, setDisplayValue] = useState<string>(value);
    const debouncedSetValue = useMemo(() => debounce(onChange, 500), [onChange]);

    useEffect(() => {
        debouncedSetValue(displayValue);
    
        return () => {
            debouncedSetValue.cancel();
        };
      }, [displayValue, debouncedSetValue]);
    
      const handleChange = (value: string) => {
        setDisplayValue(value);
      };
      
    return <TextInput 
        style={[{height: 30, width: "auto", borderCurve: 'continuous' },  style]} 
        value={displayValue} 
        onChangeText={handleChange}
        />
}
