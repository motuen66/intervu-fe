import { Box, Pagination } from "@mui/material";

export default function PaginationBar({ count, page, onChange, sx }) {
    if (!count || count <= 1) return null;

    return (
        <Box display="flex" justifyContent="center" mt={3} mb={1} {...(sx && { sx })}>
            <Pagination count={count} page={page} onChange={onChange} color="primary" shape="rounded" />
        </Box>
    );
}
