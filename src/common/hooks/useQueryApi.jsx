import { useEffect, useMemo, useState } from "react";
import { callApi } from "../utils/apiConnector";
import { METHOD } from "../constants/api";

function useQueryApi({ endPoint, displaySuccessMessage = false, param = null, trigger = true }) {
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const paramKey = useMemo(() => JSON.stringify(param), [param]);

    useEffect(() => {
        let isMounted = true;
        if (endPoint && trigger) {
            handleCallApi(isMounted);
        }
        return () => {
            isMounted = false;
        };
    }, [endPoint, displaySuccessMessage, paramKey, trigger]);

    const handleCallApi = async (isMounted) => {
        setLoading(true);
        setError(null);
        try {
            const { success, data, message } = await callApi({
                method: METHOD.GET,
                endpoint: endPoint,
                displaySuccessMessage,
                arg: param,
                alertErrorMessage: true,
                useGlobalLoading: false,
            });

            // if (isMounted) {
            console.log("API response for", endPoint, data);
            setData(data);
            // }
        } catch (error) {
            if (isMounted) {
                setError(error);
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };

    return { data, error, loading };
}

export default useQueryApi;
