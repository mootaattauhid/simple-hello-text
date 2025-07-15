
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentManager from '@/components/admin/StudentManager';
import ClassManager from '@/components/admin/ClassManager';
import { GraduationCap, School } from 'lucide-react';

const StudentManagement = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Manajemen Siswa & Kelas
        </h1>
        <p className="text-gray-600">Kelola data siswa dan kelas sekolah</p>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap size={16} />
            Data Siswa
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <School size={16} />
            Manajemen Kelas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentManager />
        </TabsContent>

        <TabsContent value="classes">
          <ClassManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentManagement;
