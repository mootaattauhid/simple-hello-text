
import React from 'react';
import { UserRoleManager } from '@/components/admin/UserRoleManager';

const UserManagement = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Manajemen Pengguna
        </h1>
        <p className="text-gray-600">Kelola role dan akses pengguna sistem</p>
      </div>

      <UserRoleManager />
    </div>
  );
};

export default UserManagement;
