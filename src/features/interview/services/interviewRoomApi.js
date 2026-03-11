export const interviewEndPoints = {
    INTERVIEW_ROOMS: "/interviewroom",
    GET_FEEDBACKS: `/Feedbacks`,
    UPDATE_FEEDBACK: (id) => `/Feedbacks/${id}`,

    CANCEL_INTERVIEW: (interviewRoomId) => `/interview-booking/cancel/${interviewRoomId}`,

    // Reschedule Request endpoints (kebab-case to match backend controller route)
    RESCHEDULE_REQUESTS: "/reschedule-requests",
    GET_RESCHEDULE_REQUEST: (id) => `/reschedule-requests/${id}`,
    CREATE_RESCHEDULE_REQUEST: "/reschedule-requests",
    RESPOND_RESCHEDULE_REQUEST: (id) => `/reschedule-requests/${id}/respond`,
    // Get ALL reschedule requests for current user (both created by user and needs user response)
    GET_ALL_RESCHEDULE_REQUESTS: "/reschedule-requests/my-requests",
    
    // Payment History endpoint
    GET_PAYMENT_HISTORY: "/interview-booking/history",
};
