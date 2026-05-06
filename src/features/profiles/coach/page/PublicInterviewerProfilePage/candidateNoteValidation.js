/**
 * Validation utility for candidate notes
 * Detects personal information that should not be shared with coaches
 */

// Patterns to detect personal information
const PERSONAL_INFO_PATTERNS = [
    {
        name: "Phone Number",
        pattern: /(\+84|0)\s?[0-9\s\-]{8,11}(?=\s|$|[^\d])/gi,
        test: (text) => {
            // Detect numeric phone numbers
            if (/(\+84|0)\s?[0-9\s\-]{8,11}(?=\s|$|[^\d])/i.test(text)) return true;
            // Detect written phone numbers in Vietnamese (không, một, hai, ba, bốn, năm, sáu, bảy, tám, chín, mười, lẻ, mươi, etc.)
            if (/(không|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|lẻ|mươi|trăm)\s+(không|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|lẻ|mươi|trăm)/i.test(text)) return true;
            // Detect written phone numbers in English (zero, one, two, three, four, five, six, seven, eight, nine, double, triple)
            return /(zero|one|two|three|four|five|six|seven|eight|nine|double|triple)\s+(zero|one|two|three|four|five|six|seven|eight|nine|double|triple)/i.test(text);
        },
    },
    {
        name: "Email Address",
        pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
        test: (text) => /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text),
    },
    {
        name: "ID/Passport Number",
        pattern: /(?:cmnd|id|passport|số hiệu|id number)[:\s]*([0-9]{9,12})/gi,
        test: (text) => /(?:cmnd|cccd|CCCD|id|passport|số hiệu|id number)[:\s]*([0-9]{9,12})/i.test(text),
    },
    {
        name: "Bank Account",
        pattern: /(?:tài khoản|account|stk|bank account)[:\s]*([0-9]{8,20})/gi,
        test: (text) => /(?:tài khoản|account|stk|bank account)[:\s]*([0-9]{8,20})/i.test(text),
    },
    {
        name: "Street Address",
        pattern: /(?:số|đường|phố|phường|quận|huyện|tỉnh|thành phố|tp|thị trấn)[:\s]*([^\n,\.]*(?:\d+)?[^\n,\.]*)/gi,
        // More specific check for actual addresses
        test: (text) => {
            const addressKeywords = /(?:số\s+\d+|đường\s+[\w\s]+|phường\s+[\w\s]+|quận\s+[\w\s\d]+|huyện\s+[\w\s]+|tỉnh\s+[\w\s]+|thành phố\s+[\w\s]+|tp\s+[\w\s]+|thị trấn\s+[\w\s]+|phố\s+[\w\s\d]+|liên lạc|địa chỉ|nhà số|số nhà)/i;
            return addressKeywords.test(text);
        },
    },
];

/**
 * Check if candidate note contains personal information
 * @param {string} note - The candidate note text
 * @returns {object} - { hasPersonalInfo: boolean, detectedTypes: string[], message: string }
 */
export function validateCandidateNote(note) {
    if (!note || typeof note !== "string" || note.trim().length === 0) {
        return {
            hasPersonalInfo: false,
            detectedTypes: [],
            message: "",
        };
    }

    const detectedTypes = [];
    const lowerNote = note.toLowerCase();

    for (const pattern of PERSONAL_INFO_PATTERNS) {
        if (pattern.test(note)) {
            detectedTypes.push(pattern.name);
        }
    }

    const hasPersonalInfo = detectedTypes.length > 0;

    return {
        hasPersonalInfo,
        detectedTypes,
        message: hasPersonalInfo
            ? `⚠️ Your note contains personal information: ${detectedTypes.join(", ")}. Please remove it to protect your privacy.`
            : "",
    };
}

/**
 * Get user-friendly message about personal info restrictions
 * @returns {string}
 */
export function getPersonalInfoRestrictionMessage() {
    return "Note contains personal information (phone number, email, address, ID number, bank account, etc.). Please remove it to protect your privacy.";
}
