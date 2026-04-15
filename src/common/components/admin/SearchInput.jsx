import React, { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';

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
        <div style={{
            display: 'flex', alignItems: 'center', width: '280px', height: '32px',
            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px',
            padding: '0 8px', transition: 'all 0.2s ease'
        }}>
            <SearchIcon style={{ fontSize: '16px', color: '#94A3B8', marginRight: '6px' }} />
            <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                style={{
                    border: 'none', background: 'transparent', outline: 'none',
                    fontSize: '13px', color: '#334155', width: '100%'
                }}
            />
        </div>
    );
}
