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
    RESERVED: 1,
    BOOKED: 2
};

export const getAvailabilityColors = (status, isPast = false) => {
    const colors = {
        AVAILABLE: { bg: "#4F46E5", border: "#4F46E5", title: "Available" },
        RESERVED: { bg: "#F97316", border: "#F97316", title: "Reserved" },
        BOOKED: { bg: "#10B981", border: "#10B981", title: "Booked" },
        PAST: { bg: "#9CA3AF", border: "#9CA3AF", title: "Past" },
    };

    if (isPast) return colors.PAST;

    switch (status) {
        case AVAILABILITY_SLOTS_STATUS.RESERVED:
            return colors.RESERVED;
        case AVAILABILITY_SLOTS_STATUS.BOOKED:
            return colors.BOOKED;
        case AVAILABILITY_SLOTS_STATUS.AVAILABLE:
        default:
            return colors.AVAILABLE;
    }
};
