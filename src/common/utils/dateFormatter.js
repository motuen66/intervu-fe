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
