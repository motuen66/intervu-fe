export const formatVndCurrency = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "N/A";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
};
