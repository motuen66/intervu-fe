import React, { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from "@mui/material/InputAdornment";
import FormTextField from "../form/FormTextField";

export default function SearchInput({ placeholder = "Search...", onSearch, delay = 400 }) {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearch) {
                onSearch(inputValue.trim());
            }
        }, delay);
        return () => clearTimeout(handler);
    }, [inputValue, delay, onSearch]);

    return (
        <FormTextField
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            sizeVariant="sm"
            hiddenLabel
            sx={{ width: 280 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                    </InputAdornment>
                ),
            }}
        />
    );
}
