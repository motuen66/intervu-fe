import { ROLES } from "../../../common/constants/common.js";

const firstNonEmpty = (...values) => {
    for (const v of values) {
        if (typeof v === "string") {
            const t = v.trim();
            if (t.length > 0) return t;
        }
    }
    return null;
};

const composeFromParts = (firstName, lastName) => {
    const f = typeof firstName === "string" ? firstName.trim() : "";
    const l = typeof lastName === "string" ? lastName.trim() : "";
    const joined = [f, l].filter(Boolean).join(" ");
    return joined.length > 0 ? joined : null;
};

const pickFromParticipant = (participant) => {
    if (!participant || typeof participant !== "object") return null;
    return firstNonEmpty(
        participant.fullName,
        participant.name,
        participant.displayName,
        composeFromParts(participant.firstName, participant.lastName),
    );
};

export function resolveLocalDisplayName(user, roomInfo, role) {
    const isCandidate = role === ROLES.CANDIDATE;
    const roomFallback = isCandidate ? roomInfo?.candidateName : roomInfo?.coachName;

    return (
        firstNonEmpty(
            user?.fullName,
            user?.name,
            user?.displayName,
            composeFromParts(user?.firstName, user?.lastName),
            user?.userName,
            roomFallback,
        ) || "You"
    );
}

export function resolveRemoteDisplayName(roomInfo, localRole) {
    const isLocalCandidate = localRole === ROLES.CANDIDATE;
    const remoteRoleLabel = isLocalCandidate ? "Coach" : "Candidate";
    if (!roomInfo) return remoteRoleLabel;

    const nestedParticipant = isLocalCandidate
        ? roomInfo.coach || roomInfo.interviewer
        : roomInfo.candidate;
    const flatName = isLocalCandidate ? roomInfo.coachName : roomInfo.candidateName;

    return (
        firstNonEmpty(pickFromParticipant(nestedParticipant), flatName) ||
        remoteRoleLabel
    );
}
