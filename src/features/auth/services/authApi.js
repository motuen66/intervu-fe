import { BE_BASE_URL } from "../../../common/constants/env";

export const authEndPoints = {
    LOGIN_API: BE_BASE_URL + "/account/login",
    GOOGLE_LOGIN_API: BE_BASE_URL + "/auth/google",
    SIGN_UP_API: BE_BASE_URL + "/account/register",
    LOGOUT_API: BE_BASE_URL + "/account/logout",
    FORGOT_PASSWORD_API: BE_BASE_URL + "/auth/forgot-password",
    VALIDATE_RESET_TOKEN_API: BE_BASE_URL + "/auth/validate-reset-token",
    RESET_PASSWORD_API: BE_BASE_URL + "/auth/reset-password",
};
