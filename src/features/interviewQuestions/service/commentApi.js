import { BE_BASE_URL } from "../../../common/constants/env";

const BASE = (questionId) => `${BE_BASE_URL}/questions/${questionId}/comments`;

export const commentEndPoints = {
    GET_LIST: (questionId) => BASE(questionId),
    ADD_COMMENT: (questionId) => BASE(questionId),
    UPDATE_COMMENT: (questionId, commentId) => `${BASE(questionId)}/${commentId}`,
    DELETE_COMMENT: (questionId, commentId) => `${BASE(questionId)}/${commentId}`,
};
