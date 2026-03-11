export const formattedDate = (date) => {
    return new Date(date).toLocaleDateString(navigator.language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const formattedDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString(navigator.language, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getYearDiff = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    let yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const m = endDate.getMonth() - startDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < startDate.getDate())) {
        yearDiff--;
    }
    return yearDiff;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

export function toLocalDateTimeWithOffset(date) {
    if (!date) return null;

    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    function pad(n) {
        return n < 10 ? "0" + n : n;
    }

    var offset = -date.getTimezoneOffset();
    var sign = offset >= 0 ? "+" : "-";

    var hoursOffset = pad(Math.floor(Math.abs(offset) / 60));
    var minutesOffset = pad(Math.abs(offset) % 60);

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds()) +
        sign +
        hoursOffset +
        ":" +
        minutesOffset
    );
}

export function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function formatDateTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
