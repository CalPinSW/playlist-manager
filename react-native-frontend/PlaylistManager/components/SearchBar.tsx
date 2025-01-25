import React, { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { debounce } from "lodash";

interface SearchBarProps {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
}

const SearchBar: FC<SearchBarProps> = ({ search, setSearch }) => {
  const [displaySearch, setDisplaySearch] = useState<string>(search);
  const debouncedSetSearch = useMemo(() => debounce(setSearch, 500), [setSearch]);

  useEffect(() => {
    // Update the debounced search value whenever displaySearch changes
    debouncedSetSearch(displaySearch);

    // Cleanup the debounce on unmount
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [displaySearch, debouncedSetSearch]);

  const handleChange = (text: string) => {
    setDisplaySearch(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search</Text>
      <TextInput
        style={styles.input}
        value={displaySearch}
        onChangeText={handleChange}
        placeholder="Type here..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    margin: 8, 
  },
  label: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
});

export default SearchBar;
