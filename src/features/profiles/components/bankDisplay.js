import axios from "axios";

const VIETQR_BANKS_URL = "https://api.vietqr.io/v2/banks";

let banksCache = null;
let banksPromise = null;

export async function getVietQrBanks() {
    if (Array.isArray(banksCache)) {
        return banksCache;
    }

    if (!banksPromise) {
        banksPromise = axios
            .get(VIETQR_BANKS_URL)
            .then((res) => {
                const banks = Array.isArray(res?.data?.data) ? res.data.data : [];
                banksCache = banks;
                return banks;
            })
            .catch((error) => {
                banksPromise = null;
                throw error;
            });
    }

    return banksPromise;
}

export function resolveBankNameByBin(bin, banks = []) {
    if (!bin) return "";

    const foundBank = banks.find((bank) => String(bank?.bin) === String(bin));
    return foundBank?.short_name || foundBank?.shortName || foundBank?.name || "";
}
