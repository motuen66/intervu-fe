import { callApi } from "../../../common/utils/apiConnector";
import { METHOD } from "../../../common/constants/api";

const BASE = "/prepared-questions";

/**
 * Enum values mirror Intervu.Domain.Entities.Constants.PreparedQuestionConstants.
 * Keep in sync with the backend — sent as integers over the wire.
 */
export const PREPARED_QUESTION_INTERACTION_TYPE = {
    NonCoding: 1,
    Coding: 2,
};

export const PREPARED_QUESTION_STATUS = {
    Pending: 1,
    Asked: 2,
};

/**
 * Backend QuestionCategory enum (Intervu.Domain.Entities.Constants.QuestionConstants).
 * Only the values the bank returns are relevant here; we map them into the binary
 * interaction type for the prepared-question UI.
 */
export const QUESTION_CATEGORY = {
    Behavioral: 1,
    Technical: 2,
    SystemDesign: 3,
    CaseStudy: 4,
    Other: 5,
    Coding: 6,
    Database: 7,
    Networking: 8,
    OOP: 9,
    Algorithms: 10,
    DataStructures: 11,
    Concurrency: 12,
    DistributedSystems: 13,
    Cloud: 14,
    DevOps: 15,
};

/**
 * Mirrors the backend PreparedQuestionMapper.MapBankToInteractionType.
 * Any category except "Coding" (and certain rounds the backend coerces) is
 * treated as NonCoding. The frontend only needs the Category-based half
 * because we never import rounds directly in the bank UI.
 */
export const categoryToInteractionType = (category) => {
    if (Number(category) === QUESTION_CATEGORY.Coding) {
        return PREPARED_QUESTION_INTERACTION_TYPE.Coding;
    }
    return PREPARED_QUESTION_INTERACTION_TYPE.NonCoding;
};

export const preparedQuestionEndPoints = {
    LIST_BY_ROOM: (roomId) => `${BASE}/rooms/${roomId}`,
    ADD_CUSTOM: (roomId) => `${BASE}/rooms/${roomId}/custom`,
    ADD_FROM_BANK: (roomId) => `${BASE}/rooms/${roomId}/from-bank`,
    UPDATE: (id) => `${BASE}/${id}`,
    DELETE: (id) => `${BASE}/${id}`,
    REORDER: (roomId) => `${BASE}/rooms/${roomId}/reorder`,
    MARK_ASKED: (id) => `${BASE}/${id}/mark-asked`,
    UNMARK_ASKED: (id) => `${BASE}/${id}/unmark-asked`,
    SEND_TO_EDITOR: (id) => `${BASE}/${id}/send-to-editor`,
};

export const getPreparedQuestionsByRoom = async (roomId) => {
    const res = await callApi({
        method: METHOD.GET,
        endpoint: preparedQuestionEndPoints.LIST_BY_ROOM(roomId),
        useGlobalLoading: false,
    });
    return res?.data ?? [];
};

export const addCustomPreparedQuestion = async (roomId, payload) => {
    const res = await callApi({
        method: METHOD.POST,
        endpoint: preparedQuestionEndPoints.ADD_CUSTOM(roomId),
        arg: payload,
    });
    return res?.data;
};

export const addPreparedQuestionFromBank = async (roomId, bankQuestionId) => {
    const res = await callApi({
        method: METHOD.POST,
        endpoint: preparedQuestionEndPoints.ADD_FROM_BANK(roomId),
        arg: { bankQuestionId },
    });
    return res?.data;
};

export const updatePreparedQuestion = async (preparedQuestionId, payload) => {
    const res = await callApi({
        method: METHOD.PUT,
        endpoint: preparedQuestionEndPoints.UPDATE(preparedQuestionId),
        arg: payload,
    });
    return res?.data;
};

export const deletePreparedQuestion = async (preparedQuestionId) => {
    await callApi({
        method: METHOD.DELETE,
        endpoint: preparedQuestionEndPoints.DELETE(preparedQuestionId),
    });
};

export const reorderPreparedQuestions = async (roomId, orderedIds) => {
    await callApi({
        method: METHOD.PUT,
        endpoint: preparedQuestionEndPoints.REORDER(roomId),
        arg: { orderedIds },
    });
};

export const markPreparedQuestionAsked = async (preparedQuestionId) => {
    const res = await callApi({
        method: METHOD.PUT,
        endpoint: preparedQuestionEndPoints.MARK_ASKED(preparedQuestionId),
    });
    return res?.data;
};

export const unmarkPreparedQuestionAsked = async (preparedQuestionId) => {
    const res = await callApi({
        method: METHOD.PUT,
        endpoint: preparedQuestionEndPoints.UNMARK_ASKED(preparedQuestionId),
    });
    return res?.data;
};

export const sendPreparedQuestionToEditor = async (preparedQuestionId) => {
    const res = await callApi({
        method: METHOD.PUT,
        endpoint: preparedQuestionEndPoints.SEND_TO_EDITOR(preparedQuestionId),
    });
    return res?.data;
};
