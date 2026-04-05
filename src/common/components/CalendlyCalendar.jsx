import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    isBefore,
    format,
    startOfDay,
} from "date-fns";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * A Calendly-style month calendar picker.
 *
 * @param {Date}     currentMonth   - Any date within the displayed month
 * @param {Function} onPrevMonth    - Called when the user clicks "<"
 * @param {Function} onNextMonth    - Called when the user clicks ">"
 * @param {Date|null} selectedDate  - Currently selected date (highlighted)
 * @param {Function} onDateSelect   - (date: Date) => void
 * @param {Set<string>} availableDates - Set of "YYYY-MM-DD" strings that have slots
 */
export default function CalendlyCalendar({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    selectedDate,
    onDateSelect,
    availableDates,
}) {
    const today = startOfDay(new Date());

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [currentMonth]);

    const canGoPrev = !isBefore(startOfMonth(currentMonth), startOfMonth(today));

    return (
        <Box>
            {/* Month navigation */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5, gap: 1 }}>
                <IconButton
                    onClick={onPrevMonth}
                    size="small"
                    disabled={!canGoPrev}
                    sx={{ color: "text.secondary" }}
                >
                    <ChevronLeftIcon />
                </IconButton>
                <Typography sx={{ mx: 1.5, fontWeight: 700, fontSize: "1rem", color: "text.primary", minWidth: 140, textAlign: "center" }}>
                    {format(currentMonth, "MMMM yyyy")}
                </Typography>
                <IconButton
                    onClick={onNextMonth}
                    size="small"
                    sx={{
                        bgcolor: "primary.main",
                        color: "#fff",
                        width: 28,
                        height: 28,
                        "&:hover": { bgcolor: "primary.dark" },
                    }}
                >
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Weekday headers */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
                {WEEKDAYS.map((day) => (
                    <Typography
                        key={day}
                        sx={{
                            textAlign: "center",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "text.disabled",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {day}
                    </Typography>
                ))}
            </Box>

            {/* Day grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 0.5 }}>
                {calendarDays.map((day, i) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, currentMonth);
                    const isPast = isBefore(day, today);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const hasSlots = availableDates.has(dateKey);
                    const isClickable = inMonth && !isPast && hasSlots;

                    return (
                        <Box
                            key={i}
                            onClick={() => isClickable && onDateSelect(day)}
                            sx={{
                                width: 40,
                                height: 40,
                                mx: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                cursor: isClickable ? "pointer" : "default",
                                bgcolor: isSelected ? "primary.main" : "transparent",
                                color: isSelected
                                    ? "#fff"
                                    : !inMonth
                                        ? "transparent"
                                        : isPast || !hasSlots
                                            ? "text.disabled"
                                            : "primary.main",
                                fontWeight: isSelected || (hasSlots && inMonth) ? 700 : 400,
                                fontSize: "0.875rem",
                                transition: "all 0.15s ease",
                                "&:hover": isClickable && !isSelected ? { bgcolor: "action.hover" } : {},
                                position: "relative",
                            }}
                        >
                            {inMonth ? format(day, "d") : ""}
                            {hasSlots && inMonth && !isSelected && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 3,
                                        width: 4,
                                        height: 4,
                                        borderRadius: "50%",
                                        bgcolor: "primary.main",
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
