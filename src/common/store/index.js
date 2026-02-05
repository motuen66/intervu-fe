import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice.js";
import homeReducer from "../../features/home/store/homeSlice.js";
import availabilityReducer from "../../features/coach/store/availabilitySlice.js";

export const rootReducer = combineReducers({
    auth: authReducer,
    home: homeReducer,
    availability: availabilityReducer,
});
