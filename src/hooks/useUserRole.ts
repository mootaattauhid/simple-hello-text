
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    console.log('useUserRole: user changed', user?.id, user?.email);
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user?.id) {
      console.log('useUserRole: No user ID available');
      setLoading(false);
      return;
    }

    try {
      console.log('useUserRole: Fetching role for user', user.id, user.email);
      
      // First try to get from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('useUserRole: Role data from user_roles:', roleData, 'Error:', roleError);

      if (roleData?.role) {
        console.log('useUserRole: Setting role from user_roles:', roleData.role);
        setRole(roleData.role);
      } else {
        // Fallback: try to get from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log('useUserRole: Profile data:', profileData, 'Error:', profileError);

        if (profileData?.role) {
          console.log('useUserRole: Setting role from profiles:', profileData.role);
          setRole(profileData.role);
        } else {
          // Special check for known admin/cashier emails
          const adminEmails = ['admin@admin.com'];
          const cashierEmails = ['kasir@kasir.com'];
          
          if (user.email && adminEmails.includes(user.email)) {
            console.log('useUserRole: Setting admin role for known admin email');
            setRole('admin');
          } else if (user.email && cashierEmails.includes(user.email)) {
            console.log('useUserRole: Setting cashier role for known cashier email');
            setRole('cashier');
          } else {
            console.log('useUserRole: Defaulting to parent role');
            setRole('parent');
          }
        }
      }
    } catch (error) {
      console.error('useUserRole: Error fetching user role:', error);
      
      // Special fallback for known emails
      if (user.email === 'admin@admin.com') {
        console.log('useUserRole: Emergency fallback to admin for admin@admin.com');
        setRole('admin');
      } else if (user.email === 'kasir@kasir.com') {
        console.log('useUserRole: Emergency fallback to cashier for kasir@kasir.com');
        setRole('cashier');
      } else {
        setRole('parent');
      }
    } finally {
      setLoading(false);
    }
  };

  console.log('useUserRole: Current state - role:', role, 'loading:', loading, 'isAdmin:', role === 'admin');

  return { role, loading, isAdmin: role === 'admin' };
};
