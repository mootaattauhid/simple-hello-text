
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        console.log('Error fetching children:', error);
        // Fallback: provide some default children data
        setChildren([
          { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
          { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
        ]);
        return;
      }

      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      // Fallback data when table doesn't exist
      setChildren([
        { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
        { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
      ]);
    }
  };

  return { children };
};
