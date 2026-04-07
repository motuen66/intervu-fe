import ReactGA from "react-ga4";

// Read GA measurement ID from Vite env. Put the key in .env: VITE_APP_GA4_MEASUREMENT_ID
const MEASUREMENT_ID = import.meta.env.VITE_APP_GA4_MEASUREMENT_ID || "";
let initialized = false;

export function initGA(measurementId = MEASUREMENT_ID) {
    if (initialized) return;
    if (typeof window === "undefined") return;
    if (!measurementId) {
        console.warn("GA Measurement ID not set (VITE_APP_GA4_MEASUREMENT_ID)");
        return;
    }
    try {
        ReactGA.initialize(measurementId);
        ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
        initialized = true;
    } catch (err) {
        console.error("GA init failed", err);
    }
}

export function trackPage(path) {
    if (!initialized) initGA();
    try {
        ReactGA.send({ hitType: "pageview", page: path });
    } catch (err) {
        console.error("GA trackPage failed", err);
    }
}

export function trackEvent(eventName, params = {}) {
    if (!initialized) initGA();
    try {
        ReactGA.event({ action: eventName, ...params });
    } catch (err) {
        console.error("GA trackEvent failed", err);
    }
}

export function trackRoomView(roomId, opts = {}) {
    trackEvent("view_room", { room_id: roomId, ...opts });
}

export function trackRoomAction(roomId, action, opts = {}) {
    trackEvent(action, { room_id: roomId, ...opts });
}

export function trackQuestionOpen(questionId, opts = {}) {
    trackEvent("view_item", { item_id: questionId, item_type: "question", ...opts });
}

export function trackQuestionInteraction(questionId, action, opts = {}) {
    trackEvent(action, { item_id: questionId, item_type: "question", ...opts });
}

export function trackAppOpen(opts = {}) {
    trackEvent("app_open", { ...opts });
}

export function trackLogin(userId = null, method = null, opts = {}) {
    trackEvent("login", { user_id: userId, method, ...opts });
}

export function trackRegister(userId = null, method = null, opts = {}) {
    trackEvent("register", { user_id: userId, method, ...opts });
}

export function trackCreateInterviewRoom(roomId, opts = {}) {
    trackEvent("create_interview_room", { room_id: roomId, ...opts });
}

export function trackJoinInterviewRoom(roomId, opts = {}) {
    trackEvent("join_interview_room", { room_id: roomId, ...opts });
}

export function trackLeaveInterviewRoom(roomId, opts = {}) {
    trackEvent("leave_interview_room", { room_id: roomId, ...opts });
}

export function trackSubmitFeedback(interviewId, rating = null, comments = null, opts = {}) {
    trackEvent("submit_feedback", {
        interview_id: interviewId,
        rating: rating,
        comments: comments,
        comment_length: typeof comments === "string" ? comments.length : null,
        ...opts,
    });
}

export function trackContributeQuestion(questionId = null, topic = null, level = null, opts = {}) {
    trackEvent("contribute_question", { question_id: questionId, topic, level, ...opts });
}

export function trackCreateBooking(bookingId = null, coachId = null, serviceId = null, amount = null, opts = {}) {
    trackEvent("create_booking", { booking_id: bookingId, coach_id: coachId, service_id: serviceId, amount, ...opts });
}

export function trackInitiatePayment(bookingId = null, amount = null, opts = {}) {
    trackEvent("initiate_payment", { booking_id: bookingId, amount, ...opts });
}

export function trackPaymentSuccess(bookingId = null, amount = null, opts = {}) {
    trackEvent("payment_success", { booking_id: bookingId, amount, ...opts });
}

export function trackCreateComment(questionId = null, commentId = null, contentLength = null, opts = {}) {
    trackEvent("create_comment", {
        question_id: questionId,
        comment_id: commentId,
        content_length: contentLength,
        ...opts,
    });
}

// --- Service analytics helpers -------------------------------------------
export function trackCreateService(serviceId = null, interviewTypeId = null, price = null, durationMinutes = null, opts = {}) {
    trackEvent("create_service", { service_id: serviceId, interview_type_id: interviewTypeId, price, duration_minutes: durationMinutes, ...opts });
}

export function trackServiceUsed(serviceId = null, bookingId = null, coachId = null, amount = null, opts = {}) {
    trackEvent("service_used", { service_id: serviceId, booking_id: bookingId, coach_id: coachId, amount, ...opts });
}

export default {
    initGA,
    trackPage,
    trackEvent,
    trackRoomView,
    trackRoomAction,
    trackQuestionOpen,
    trackQuestionInteraction,
    trackAppOpen,
    trackLogin,
    trackRegister,
    trackCreateInterviewRoom,
    trackJoinInterviewRoom,
    trackLeaveInterviewRoom,
    trackSubmitFeedback,
    trackContributeQuestion,
    trackCreateBooking,
    trackInitiatePayment,
    trackPaymentSuccess,
    trackCreateComment,
    trackCreateService,
    trackServiceUsed,
};
