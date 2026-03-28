// ── Sort (SortOption: Hot=1, New=2, Top=3) ─────────────────────────────────
export const SORT_OPTIONS = [
    { value: 1, label: "Hot" },
    { value: 2, label: "New" },
    { value: 3, label: "Top" },
];

// ── Question type (QuestionType integers) ────────────────────────────────────
export const QUESTION_TYPE_OPTIONS = [
    { value: "", label: "Any Category" },
    { value: 1, label: "Behavioral" },
    { value: 2, label: "Technical" },
    { value: 3, label: "System Design" },
    { value: 4, label: "Case Study" },
    { value: 5, label: "Other" },
    { value: 6, label: "Coding" },
    { value: 7, label: "Database" },
    { value: 8, label: "Networking" },
    { value: 9, label: "OOP" },
    { value: 10, label: "Algorithms" },
    { value: 11, label: "Data Structures" },
    { value: 12, label: "Concurrency" },
    { value: 13, label: "Distributed Systems" },
    { value: 14, label: "Cloud" },
    { value: 15, label: "DevOps" },
];

// Aliases kept for backward-compat imports
export const CATEGORIES = QUESTION_TYPE_OPTIONS;
export const QUESTION_TYPES = QUESTION_TYPE_OPTIONS.filter((t) => t.value !== "");

// ── Role (Role integers) ─────────────────────────────────────────────────────
export const ROLES = [
    { value: "", label: "Any Role" },
    { value: 1, label: "Product Manager" },
    { value: 2, label: "Software Engineer" },
    { value: 3, label: "Data Engineer" },
    { value: 4, label: "Data Scientist" },
    { value: 5, label: "Technical Program Manager" },
    { value: 6, label: "Backend Engineer" },
    { value: 7, label: "Frontend Engineer" },
    { value: 8, label: "Full Stack Engineer" },
    { value: 9, label: "Mobile Engineer" },
    { value: 10, label: "DevOps Engineer" },
    { value: 11, label: "QA Engineer" },
    { value: 12, label: "Machine Learning Engineer" },
    { value: 13, label: "Security Engineer" },
    { value: 14, label: "Cloud Engineer" },
    { value: 15, label: "UI/UX Designer" },
    { value: 16, label: "Business Analyst" },
    { value: 17, label: "Solution Architect" },
];

// ── Experience level (ExperienceLevel: Intern=0 … Expert=7) ─────────────────
export const LEVELS = [
    { value: "", label: "Any Level" },
    { value: 0, label: "Intern" },
    { value: 1, label: "Junior" },
    { value: 2, label: "Middle" },
    { value: 3, label: "Senior" },
    { value: 4, label: "Lead" },
    { value: 5, label: "Manager" },
    { value: 6, label: "Director" },
    { value: 7, label: "Expert" },
];

// ── Interview round (InterviewRound integers) ────────────────────────────────
export const ROUNDS = [
    { value: 1, label: "Phone Screen" },
    { value: 2, label: "Technical Screen" },
    { value: 3, label: "Take-home" },
    { value: 4, label: "Onsite / Final Round" },
    { value: 5, label: "Other" },
    { value: 6, label: "HR Round" },
    { value: 7, label: "Coding Challenge" },
    { value: 8, label: "Live Coding" },
    { value: 9, label: "System Design Round" },
    { value: 10, label: "Behavioral Round" },
    { value: 11, label: "Managerial Round" },
];

// ── Popular roles for sidebar chips ─────────────────────────────────────────
export const POPULAR_ROLES = [
    { value: 1, label: "Product Manager" },
    { value: 2, label: "Software Engineer" },
    { value: 5, label: "Technical Program Manager" },
    { value: 3, label: "Data Engineer" },
    { value: 4, label: "Data Scientist" },
];

// ── Question status (QuestionStatus integers) ───────────────────────────────
export const QUESTION_STATUS = [
    { value: 0, label: "Draft" },
    { value: 1, label: "Published" },
    { value: 2, label: "Archived" },
];

export const COMPANY_DOMAINS = {
    Google: "google.com",
    Meta: "facebook.com",
    Amazon: "amazon.com",
    Microsoft: "microsoft.com",
    Netflix: "netflix.com",
    TikTok: "tiktok.com",
    Apple: "apple.com",
    Uber: "uber.com",
    Spotify: "spotify.com",
    Stripe: "stripe.com",
    Shopee: "shopee.com",
};

// ── Interview Room Type ───────────────────────
export const INTERVIEW_ROOM_TYPE = {
    NORMAL: 0,
    WITH_AI: 1,
    PEER: 2,
};
