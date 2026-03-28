import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function RootPage() {
  const { userData, token } = useSelector((state) => state.auth || {});
  
  // If user is authenticated, redirect to home
  if (token && userData) {
    return <Navigate to="/home" replace />;
  }

  // If user is not authenticated, show landing page
  return <Navigate to="/landing" replace />;
}

export default RootPage;
