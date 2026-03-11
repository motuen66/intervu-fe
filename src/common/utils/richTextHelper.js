const HTML_ENTITIES = [
    [/&amp;/g, "&"],
    [/&lt;/g, "<"],
    [/&gt;/g, ">"],
    [/&nbsp;/g, " "],
    [/&#39;/g, "'"],
    [/&quot;/g, '"'],
];

export const isQuillEmpty = (val) => !val || val === "<p><br></p>" || val.trim() === "";

export const htmlToPlainText = (html) => {
    if (!html) return "";
    const withNewlines = html
        .replace(/<\/p>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "");
    return HTML_ENTITIES.reduce((str, [pattern, replacement]) => str.replace(pattern, replacement), withNewlines)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};
