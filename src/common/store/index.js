import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice.js";
import homeReducer from "../../features/home/store/homeSlice.js";
import availabilityReducer from "../../features/coach/store/availabilitySlice.js";
import notificationReducer from "../../features/notification/store/notificationSlice.js";
import smartSearchReducer from "../../features/smartSearch/store/smartSearchSlice.js";

export const rootReducer = combineReducers({
    auth: authReducer,
    home: homeReducer,
    availability: availabilityReducer,
    notification: notificationReducer,
    smartSearch: smartSearchReducer,
});
