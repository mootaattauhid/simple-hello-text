
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserRoleRow } from './UserRoleRow';

export const UserRoleManager = () => {
  const { profileUsers, loading, updateUserRole, getUserRole } = useUserManagement();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Manajemen Role Pengguna
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profileUsers.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              Tidak ada data pengguna. Pastikan Anda memiliki akses admin.
            </div>
          ) : (
            profileUsers.map((user) => (
              <UserRoleRow
                key={user.id}
                user={user}
                currentRole={getUserRole(user.id)}
                onRoleChange={updateUserRole}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
