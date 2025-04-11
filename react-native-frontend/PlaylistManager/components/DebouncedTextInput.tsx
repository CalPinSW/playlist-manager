import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash"
import { TextInput } from "react-native";

interface DebouncedTextInputProps {
    value: string;
    onChange: Dispatch<SetStateAction<string>>;
}

export const DebouncedTextInput: FC<DebouncedTextInputProps> = ({value, onChange}) => {
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
        style={{height: 50, width: "100%", backgroundColor: "grey", borderCurve: 'continuous', margin: 4}} 
        value={displayValue} 
        onChangeText={handleChange}
        />
}
