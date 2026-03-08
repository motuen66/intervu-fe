import { INTERVIEW_ROOM_STATUS } from "./status";

export function getInterviewRoomStatusConfig(status, { isRescheduled = false, hasPendingReschedule = false } = {}) {
    if (status === INTERVIEW_ROOM_STATUS.SCHEDULED && isRescheduled) {
        return { label: "Rescheduled", color: "info" };
    }
    if (status === INTERVIEW_ROOM_STATUS.SCHEDULED && hasPendingReschedule) {
        return { label: "Pending Reschedule", color: "warning" };
    }

    switch (status) {
        case INTERVIEW_ROOM_STATUS.SCHEDULED:
            return { label: "Scheduled", color: "primary" };
        case INTERVIEW_ROOM_STATUS.ON_GOING:
            return { label: "Ongoing", color: "success" };
        case INTERVIEW_ROOM_STATUS.COMPLETED:
            return { label: "Completed", color: "default" };
        case INTERVIEW_ROOM_STATUS.CANCELLED:
            return { label: "Cancelled", color: "error" };
        default:
            return { label: "Unknown", color: "default" };
    }
}

// RescheduleRequestStatus: Pending=0, Approved=1, Rejected=2, Expired=3
export function getRescheduleRequestStatusConfig(status) {
    switch (status) {
        case 0:
            return { label: "Pending", color: "warning" };
        case 1:
            return { label: "Approved", color: "success" };
        case 2:
            return { label: "Rejected", color: "error" };
        case 3:
            return { label: "Expired", color: "default" };
        default:
            return { label: "Unknown", color: "default" };
    }
}

