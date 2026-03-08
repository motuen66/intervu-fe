export const INTERVIEW_ROOM_STATUS = {
    SCHEDULED: 0,
    ON_GOING: 1,
    COMPLETED: 2,
    CANCELLED: 3,
    NO_SHOW: 4,
};

export const TRANSACTION_STATUS = {
    CREATED: 0,
    PAID: 1,
    CANCEL: 2,
};

export const PAYOS_TRANSACTION_STATUS = {
    PAID: "PAID",
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    CANCELLED: "CANCELLED",
};

export const AVAILABILITY_SLOTS_STATUS = {
    AVAILABLE: 0,
    UNAVAILABLE: 1,
};

export const AIM_LEVEL = {
    JUNIOR: 0,
    MID_LEVEL: 1,
    SENIOR: 2,
    TEAM_LEADER: 3,
};

export const AIM_LEVEL_LABELS = {
    [AIM_LEVEL.JUNIOR]: "Junior",
    [AIM_LEVEL.MID_LEVEL]: "Mid-Level",
    [AIM_LEVEL.SENIOR]: "Senior",
    [AIM_LEVEL.TEAM_LEADER]: "Team Leader",
};

export const BOOKING_REQUEST_STATUS = {
    PENDING: 0,
    ACCEPTED: 1,
    REJECTED: 2,
    PAID: 3,
    EXPIRED: 4,
    CANCELLED: 5,
};

export const BOOKING_REQUEST_STATUS_LABELS = {
    [BOOKING_REQUEST_STATUS.PENDING]: "Pending",
    [BOOKING_REQUEST_STATUS.ACCEPTED]: "Accepted",
    [BOOKING_REQUEST_STATUS.REJECTED]: "Rejected",
    [BOOKING_REQUEST_STATUS.PAID]: "Paid",
    [BOOKING_REQUEST_STATUS.EXPIRED]: "Expired",
    [BOOKING_REQUEST_STATUS.CANCELLED]: "Cancelled",
};

export const BOOKING_REQUEST_TYPE = {
    EXTERNAL: 0,
    JD_INTERVIEW: 1,
};

export const BOOKING_REQUEST_TYPE_LABELS = {
    [BOOKING_REQUEST_TYPE.EXTERNAL]: "External",
    [BOOKING_REQUEST_TYPE.JD_INTERVIEW]: "JD Interview",
};

export const getAvailabilityColors = (status, isPast = false) => {
    const colors = {
        AVAILABLE: { bg: "#4F46E5", border: "#4F46E5", title: "Available" },
        UNAVAILABLE: { bg: "#EF4444", border: "#EF4444", title: "Unavailable" },
        PAST: { bg: "#9CA3AF", border: "#9CA3AF", title: "Past" },
    };

    if (isPast) return colors.PAST;

    switch (status) {
        case AVAILABILITY_SLOTS_STATUS.UNAVAILABLE:
            return colors.UNAVAILABLE;
        case AVAILABILITY_SLOTS_STATUS.AVAILABLE:
        default:
            return colors.AVAILABLE;
    }
};
