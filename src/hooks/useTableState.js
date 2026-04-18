import { useState } from 'react';

export default function useTableState(initialPageSize = 10) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [totalItems, setTotalItems] = useState(0);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(0); // Reset to first page
    };

    return {
        data,
        setData,
        loading,
        setLoading,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalItems,
        setTotalItems,
        handlePageChange,
        handlePageSizeChange
    };
}
