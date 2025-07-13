
import { useAuthContext } from '@/components/AuthProvider';

export const useAuth = () => {
  const context = useAuthContext();
  return {
    user: context.user,
    session: context.session,
    loading: context.loading,
    signOut: context.signOut,
    signIn: context.signIn,
    signUp: context.signUp
  };
};
