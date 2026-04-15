import { BE_BASE_URL } from "../../../common/constants/env";
import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

const BASE_URL = `${BE_BASE_URL}/wallet`;

export const getWalletBalance = async () => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/balance`,
    });
    return result.data;
};

export const requestWithdrawal = async (data) => {
    const result = await callApi({
        method: METHOD.POST,
        endpoint: `${BASE_URL}/withdraw`,
        arg: data,
        displaySuccessMessage: true,
        alertErrorMessage: true,
    });
    return result.data;
};

export const getWithdrawalHistory = async (page = 1, pageSize = 10) => {
    const result = await callApi({
        method: METHOD.GET,
        endpoint: `${BASE_URL}/withdrawals`,
        arg: { page, pageSize },
    });
    return result.data;
};
