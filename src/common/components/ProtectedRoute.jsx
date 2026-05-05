import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { ROLES } from "../constants/common";
import SessionExpiredGate from "./SessionExpiredGate";

function ProtectedRoute({ allowedRoles = [], children }) {
    const { token, userData } = useSelector((state) => state.auth);

    if (!token) {
        return <SessionExpiredGate />;
    }
 else if (!allowedRoles.includes(userData?.role)) {
        if (userData?.role === ROLES.CANDIDATE) return <Navigate to="/candidate" />;
        if (userData?.role === ROLES.INTERVIEWER) return <Navigate to="/interview" />;
        if (userData?.role === ROLES.ADMIN) return <Navigate to="/login" />;
    } else {
        return children;
    }
}

export default ProtectedRoute;
