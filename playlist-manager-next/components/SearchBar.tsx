import React, { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash"

interface SearchBarProps {
    title: string,
    search: string,
    setSearch: Dispatch<SetStateAction<string>>
}

const SearchBar: FC<SearchBarProps> = ({
    title,
    search,
    setSearch
}) => {
    const [displaySearch, setDisplaySearch] = useState<string>(search);
    const debouncedSetSearch = useMemo(() => debounce(setSearch, 500), [setSearch]);

    useEffect(() => {
        // Update the debounced search value whenever localSearch changes
        debouncedSetSearch(displaySearch);
    
        // Cleanup the debounce on unmount
        return () => {
          debouncedSetSearch.cancel();
        };
      }, [displaySearch, debouncedSetSearch]);
    
      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDisplaySearch(event.target.value);
      };
    

    return (
        <div className="w-full flex space-x-4">
            <div>{title}</div>
            <input className="w-full py-1 border-solid border border-primary-lighter bg-background-offset rounded-md" type="text" onChange={handleChange} value={displaySearch} />
        </div>
)};

export default SearchBar;
