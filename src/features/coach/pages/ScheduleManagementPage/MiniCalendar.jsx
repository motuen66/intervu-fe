import React, { useState, useMemo } from "react";
import { Box, CardContent, Typography, IconButton, Stack } from "@mui/material";
import BaseCard from "../../../../common/components/cards/BaseCard";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const MiniCalendar = ({ availabilities, onDateClick, currentDate, selectedDate }) => {
    const [displayDate, setDisplayDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        return { daysInMonth, startingDayOfWeek, year, month };
    }, [displayDate]);

    // Group availabilities by date
    const availabilitiesByDate = useMemo(() => {
        const map = {};
        availabilities.forEach((avail) => {
            // Only count future/current slots
            const startDate = new Date(avail.startTime);
            const endDate = new Date(avail.endTime);
            if (endDate >= new Date()) {
                const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
                if (!map[dateStr]) {
                    map[dateStr] = 0;
                }
                map[dateStr]++;
            }
        });
        return map;
    }, [availabilities]);

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(daysInMonth.year, daysInMonth.month, day);
        onDateClick(clickedDate);
    };

    const renderDots = (count) => {
        if (count === 0) return null;

        const maxDots = 3;
        const dotsToShow = Math.min(count, maxDots);

        return (
            <Box sx={{ display: "flex", gap: "2px", justifyContent: "center", mt: 0.5 }}>
                {Array.from({ length: dotsToShow }).map((_, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor: "secondary.main",
                        }}
                    />
                ))}
                {count > maxDots && (
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: "8px",
                            fontWeight: 600,
                            color: "secondary.dark",
                            lineHeight: 1,
                        }}
                    >
                        +
                    </Typography>
                )}
            </Box>
        );
    };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Get selected date string for comparison
    const selectedDateStr = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}` : null;

    // Generate calendar grid
    const calendarDays = [];
    const totalCells = Math.ceil((daysInMonth.startingDayOfWeek + daysInMonth.daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - daysInMonth.startingDayOfWeek + 1;
        const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth.daysInMonth;

        if (isValidDay) {
            const dateStr = `${daysInMonth.year}-${String(daysInMonth.month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
            const slotsCount = availabilitiesByDate[dateStr] || 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr && !isToday;

            calendarDays.push(
                <Box
                    key={i}
                    onClick={() => handleDateClick(dayNumber)}
                    sx={{
                        aspectRatio: "1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderRadius: "8px",
                        border: isToday ? "2px solid" : (isSelected ? "1.5px solid" : "none"),
                        borderColor: isToday ? "primary.main" : (isSelected ? "primary.light" : "transparent"),
                        backgroundColor: isToday ? "primary.main" : (isSelected ? "transparent" : "transparent"),
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: isToday ? "primary.light" : "action.hover",
                        },
                        position: "relative",
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: isToday ? 700 : (isSelected ? 600 : 500),
                            color: isToday ? "primary.contrastText" : (isSelected ? "primary.main" : "text.primary"),
                            fontSize: "0.875rem",
                        }}
                    >
                        {dayNumber}
                    </Typography>
                    {renderDots(slotsCount)}
                </Box>
            );
        } else {
            calendarDays.push(<Box key={i} />);
        }
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <BaseCard
            variant="outlined"
            sx={{
                borderColor: "divider",
                borderRadius: "12px",
                height: "fit-content",
            }}
        >
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <IconButton size="small" onClick={handlePrevMonth}>
                        <IoChevronBack size={16} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
                    </Typography>
                    <IconButton size="small" onClick={handleNextMonth}>
                        <IoChevronForward size={16} />
                    </IconButton>
                </Stack>

                {/* Weekday headers */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "4px",
                        mb: 1,
                    }}
                >
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                            }}
                        >
                            {day}
                        </Box>
                    ))}
                </Box>

                {/* Calendar grid */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: "4px",
                    }}
                >
                    {calendarDays}
                </Box>

                {/* Legend */}
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <Box
                            sx={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "secondary.main",
                            }}
                        />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                            = 1 slot
                        </Typography>
                    </Stack>
                </Box>
            </CardContent>
        </BaseCard>
    );
};

export default MiniCalendar;