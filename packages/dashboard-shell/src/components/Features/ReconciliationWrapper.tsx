/**
 * Reconciliation Tool Wrapper
 * 
 * Wrapper component that integrates the ReconciliationFeature with the dashboard shell,
 * providing authentication context and navigation functionality.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ReconciliationFeature } from 'reconciliation-tool';

// ============================================================================
// Component
// ============================================================================

export const ReconciliationWrapper: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  // Handle navigation back to dashboard
  const handleNavigateBack = () => {
    navigate('/dashboard');
  };

  // Prepare auth context for the reconciliation tool
  const authContext = {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading
  };

  return (
    <ReconciliationFeature
      authContext={authContext}
      onNavigateBack={handleNavigateBack}
    />
  );
};

export default ReconciliationWrapper;