import React from 'react';
import { Box, Stack, Skeleton, Divider, alpha } from '@mui/material';
import BaseCard from '../../../../../../common/components/cards/BaseCard';

const InterviewCardSkeleton = () => {
  const FIXED_CARD_HEIGHT = 380;

  return (
    <BaseCard
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: "18px",
        border: "1px solid var(--mui-palette-divider)",
        width: "100%",
        height: `${FIXED_CARD_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header Skeleton */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Skeleton variant="circular" width={72} height={72} animation="wave" />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} animation="wave" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={16} animation="wave" />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Skeleton variant="circular" width={16} height={16} animation="wave" />
            <Skeleton variant="text" width={40} height={16} animation="wave" />
          </Stack>
        </Box>
        <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} animation="wave" />
      </Stack>

      <Divider sx={{ my: 1 }} />

      {/* Progress & Info Skeleton */}
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width={100} height={14} animation="wave" />
          <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 5 }} animation="wave" />
        </Stack>

        <Box sx={{ width: '100%', height: 8, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} animation="wave" />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
           <Skeleton variant="circular" width={14} height={14} animation="wave" />
           <Skeleton variant="text" width={120} height={14} animation="wave" />
        </Stack>
      </Stack>

      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2} justifyContent="space-between">
           <Skeleton variant="rectangular" width="45%" height={36} sx={{ borderRadius: 2 }} animation="wave" />
           <Skeleton variant="rectangular" width="45%" height={36} sx={{ borderRadius: 2 }} animation="wave" />
        </Stack>
      </Box>
    </BaseCard>
  );
};

export default InterviewCardSkeleton;
