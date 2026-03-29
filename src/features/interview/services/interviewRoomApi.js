export const interviewEndPoints = {
    INTERVIEW_ROOMS: "/interviewroom",
    GET_FEEDBACKS: `/Feedbacks`,
    UPDATE_FEEDBACK: (id) => `/Feedbacks/${id}`,

    GET_COACH_EVALUATION: (interviewRoomId) => `/interviewroom/${interviewRoomId}/coach-evaluation`,
    SUBMIT_COACH_EVALUATION: (interviewRoomId) => `/interviewroom/${interviewRoomId}/coach-evaluation`,
    DRAFT_COACH_EVALUATION: (interviewRoomId) => `/interviewroom/${interviewRoomId}/coach-evaluation/draft`,

    CANCEL_INTERVIEW: (interviewRoomId) => `/interview-booking/cancel/${interviewRoomId}`,
    CANCEL_BOOKING_REQUEST: (bookingRequestId) => `/booking-requests/${bookingRequestId}/cancel`,

    UPLOAD_CV_AI_INTERVIEW: `/ai/upload-cv-ai-interview`,
    GET_LAST_CV_PDF_URL: `/ai/last-cv-pdf-url`,
    AI_INTERVIEW_INTRO: "/ai/interview-intro",
    AI_INTERVIEW_TRANSCRIBE: "/ai/interview-transcribe",
    STORE_AUDIO_CHUNK: "/ai/store-audio-chunk",
    TRANSCRIPT_QUESTIONS: "/ai/transcript/questions",

    // Reschedule Request endpoints (kebab-case to match backend controller route)
    RESCHEDULE_REQUESTS: "/reschedule-requests",
    GET_RESCHEDULE_REQUEST: (id) => `/reschedule-requests/${id}`,
    CREATE_RESCHEDULE_REQUEST: "/reschedule-requests",
    RESPOND_RESCHEDULE_REQUEST: (id) => `/reschedule-requests/${id}/respond`,
    // Get ALL reschedule requests for current user (both created by user and needs user response)
    GET_ALL_RESCHEDULE_REQUESTS: "/reschedule-requests/my-requests",

    // Payment History endpoint
    GET_PAYMENT_HISTORY: "/interview-booking/history",

    // Generated Questions endpoints
    GET_GENERATED_QUESTIONS_BY_ROOM: (roomId) => `/generated-questions/rooms/${roomId}`,
    APPROVE_GENERATED_QUESTION: (id) => `/generated-questions/${id}/approve`,
    REJECT_GENERATED_QUESTION: (id) => `/generated-questions/${id}/reject`,
};
