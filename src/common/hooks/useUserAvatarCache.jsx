import { useEffect, useState } from "react";
import { callApi } from "../utils/apiConnector";
import { METHOD } from "../constants/api";
import { userEndPoints } from "../services/userApi";

const avatarCache = new Map();

export function useUserAvatarCache(userIds = []) {
    const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
    const cacheKey = uniqueIds.join(",");

    const buildFromCache = () =>
        Object.fromEntries(uniqueIds.filter((id) => avatarCache.has(id)).map((id) => [id, avatarCache.get(id)]));

    const [avatars, setAvatars] = useState(buildFromCache);

    useEffect(() => {
        if (!uniqueIds.length) return;

        const missing = uniqueIds.filter((id) => !avatarCache.has(id));

        if (!missing.length) {
            setAvatars(buildFromCache());
            return;
        }

        Promise.allSettled(
            missing.map((id) =>
                callApi({ method: METHOD.GET, endpoint: userEndPoints.GET_USER_PROFILE(id) })
                    .then(({ data }) => {
                        const url = data?.profilePicture ?? data?.user?.profilePicture ?? "";
                        avatarCache.set(id, url);
                        return [id, url];
                    })
                    .catch(() => {
                        avatarCache.set(id, "");
                        return [id, ""];
                    }),
            ),
        ).then(() => setAvatars(buildFromCache()));
    }, [cacheKey]);

    return avatars;
}
