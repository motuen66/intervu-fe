export const DASHBOARD_LAYOUT = {
    cardPadding: 2.5,
    panelGap: 2.5,
    cardHeaderMarginBottom: 2,
    listItemPaddingY: 1.5,
    emptyStatePaddingY: 3,
    kpiSectionMarginTop: 3,
    contentGridMarginTop: 2,
};

export function getServiceColorByName(theme, serviceName, index = 0) {
    const normalized = (serviceName || "").toLowerCase();

    const namedPalette = [
        { keywords: ["react", "frontend", "fe"], color: theme.palette.info.main },
        { keywords: ["system", "design", "architecture"], color: theme.palette.primary.main },
        { keywords: ["dsa", "algorithm", "data structure"], color: theme.palette.warning.main },
        { keywords: ["behavior", "communication", "soft"], color: theme.palette.success.main },
        { keywords: ["backend", "api", "database"], color: theme.palette.secondary.dark },
        { keywords: ["devops", "cloud"], color: theme.palette.error.main },
    ];

    const matched = namedPalette.find((x) => x.keywords.some((k) => normalized.includes(k)));
    if (matched) return matched.color;

    const fallbackPalette = [
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.primary.main,
        theme.palette.secondary.dark,
        theme.palette.error.main,
    ];

    return fallbackPalette[index % fallbackPalette.length];
}
