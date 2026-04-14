import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { startGlobalLoading, stopGlobalLoading } from "../store/authSlice";

function useGlobalLoading() {
    const dispatch = useDispatch();
    const loading = useSelector((state) => Boolean(state.auth?.loading));

    const showLoading = useCallback(() => {
        dispatch(startGlobalLoading());
    }, [dispatch]);

    const hideLoading = useCallback(() => {
        dispatch(stopGlobalLoading());
    }, [dispatch]);

    const withLoading = useCallback(
        async (handler) => {
            showLoading();
            try {
                return await handler();
            } finally {
                hideLoading();
            }
        },
        [hideLoading, showLoading],
    );

    return { loading, showLoading, hideLoading, withLoading };
}

export default useGlobalLoading;
