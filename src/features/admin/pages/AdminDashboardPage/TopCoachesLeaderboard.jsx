import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import { Star } from "@mui/icons-material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import SectionHeading from "../../../../common/components/SectionHeading";

export default function TopCoachesLeaderboard({ data, loading }) {
    if (loading && (!data || data.length === 0)) {
        return (
            <BaseCard sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <SectionHeading title="Top Coaches" size="sm" />
                </Box>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="text" width="40%" height={16} />
                        </Box>
                    </Box>
                ))}
            </BaseCard>
        );
    }

    return (
        <BaseCard sx={{ p: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
                <SectionHeading title="Top Coaches" size="sm" disableGutters />
            </Box>
            {!data || data.length === 0 ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 4,
                        px: 3,
                        textAlign: "center",
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        No coach activity yet.
                    </Typography>
                </Box>
            ) : (
                <List sx={{ py: 0 }}>
                    {data.map((coach, index) => (
                        <React.Fragment key={coach.rank ?? coach.name ?? index}>
                            <ListItem
                                sx={{
                                    py: 2,
                                    px: 3,
                                    alignItems: "center",
                                    "&:hover": { bgcolor: "action.hover" }
                                }}
                            >
                                <Box sx={{ minWidth: 28, mr: 1.5 }}>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                                        #{coach.rank ?? index + 1}
                                    </Typography>
                                </Box>
                                <ListItemAvatar sx={{ minWidth: 72 }}>
                                    <Avatar src={coach.avatarUrl} sx={{ width: 44, height: 44 }}>
                                        {coach.name.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    sx={{ mr: 2 }}
                                    primary={
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            noWrap
                                            sx={{ maxWidth: { xs: 140, sm: 180, md: 220 } }}
                                        >
                                            {coach.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ mt: 0.25, display: "block", maxWidth: { xs: 140, sm: 180, md: 220 } }}
                                        >
                                            {coach.company}
                                        </Typography>
                                    }
                                />
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, minWidth: { xs: 150, sm: 170 } }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ minWidth: 92, textAlign: "right" }}>
                                        Sessions: {coach.sessionCount ?? 0}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", color: "warning.main", minWidth: 56 }}>
                                        <Star sx={{ fontSize: 14, mr: 0.25 }} />
                                        <Typography variant="caption" fontWeight={700}>
                                            {Number.isFinite(Number(coach.rating)) ? Number(coach.rating).toFixed(1) : "N/A"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItem>
                            {index < data.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </BaseCard>
    );
}
