
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, UserCheck, Users } from 'lucide-react';
import { ProfileUser } from '@/types/userManagement';

interface UserRoleRowProps {
  user: ProfileUser;
  currentRole: string;
  onRoleChange: (userId: string, newRole: string) => void;
}

export const UserRoleRow = ({ user, currentRole, onRoleChange }: UserRoleRowProps) => {
  const getRoleIcon = () => {
    if (currentRole === 'admin') {
      return <Shield className="h-4 w-4 text-red-600" />;
    } else if (currentRole === 'cashier') {
      return <UserCheck className="h-4 w-4 text-blue-600" />;
    } else {
      return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const displayName = user.full_name || `User ${user.id.slice(0, 8)}`;
  const displaySubtext = user.full_name 
    ? `ID: ${user.id.slice(0, 8)}...` 
    : `ID: ${user.id}`;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-full">
          {getRoleIcon()}
        </div>
        <div>
          <p className="font-medium">
            {displayName}
          </p>
          <p className="text-sm text-gray-500">
            {displaySubtext}
          </p>
          <p className="text-xs text-gray-400">
            Role saat ini: {currentRole}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Select
          value={currentRole}
          onValueChange={(newRole) => onRoleChange(user.id, newRole)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="cashier">Kasir</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
