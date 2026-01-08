import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { ROLES } from "../constants/common";

function ProtectedRoute({ allowedRoles = [], children }) {
    const { token, userData } = useSelector((state) => state.auth);

    console.log('🔒 ProtectedRoute check:', {
        token: !!token,
        userRole: userData?.role,
        allowedRoles,
        hasAccess: allowedRoles.includes(userData?.role)
    });

    if (!token) {
        alert("Session expired. Please log in again.");
        return <Navigate to="/login" />;
    } else if (!allowedRoles.includes(userData?.role)) {
        if (userData?.role === ROLES.CANDIDATE) return <Navigate to="/home" />;
        if (userData?.role === ROLES.INTERVIEWER) return <Navigate to="/interview" />;
        if (userData?.role === ROLES.ADMIN) return <Navigate to="/login" />;
    } else {
        return children;
    }
}

export default ProtectedRoute;
