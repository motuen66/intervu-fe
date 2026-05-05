import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ROLES } from '../../common/constants/common';

function RootPage() {
  const { userData, token } = useSelector((state) => state.auth || {});
  
  // If user is authenticated, redirect based on role
  if (token && userData) {
    const role = Number(userData.role);
    
    if (role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    if (role === ROLES.INTERVIEWER) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/candidate" replace />;
  }

  // If user is not authenticated, show landing page
  return <Navigate to="/landing" replace />;
}

export default RootPage;
