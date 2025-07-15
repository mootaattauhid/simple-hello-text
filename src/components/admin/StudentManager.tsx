import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import StudentForm from './StudentManager/StudentForm';
import StudentTable from './StudentManager/StudentTable';
import ImportExportButtons from './StudentManager/ImportExportButtons';

interface Student {
  id: string;
  nik: string;
  nis?: string;
  name: string;
  class_name?: string;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

const StudentManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin) {
      fetchStudents();
      fetchClasses();
    }
  }, [isAdmin]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nik = formData.get('nik') as string;
    const nis = formData.get('nis') as string;
    const name = formData.get('name') as string;
    const className = formData.get('className') as string;

    // Handle the "no-class" value
    const processedClassName = className === 'no-class' ? null : className || null;

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            nik,
            nis: nis || null,
            name,
            class_name: processedClassName,
          })
          .eq('id', editingStudent.id);

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Data siswa berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            nik,
            nis: nis || null,
            name,
            class_name: processedClassName,
          });

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Siswa berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data siswa",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      
      toast({
        title: "Berhasil!",
        description: "Data siswa berhasil dihapus",
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus data siswa",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        
        const studentsData = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 3 && values[0]) {
            studentsData.push({
              nik: values[0],
              nis: values[1] || null,
              name: values[2],
              class_name: values[3] || null,
            });
          }
        }

        if (studentsData.length > 0) {
          const { error } = await supabase
            .from('students')
            .insert(studentsData);

          if (error) throw error;
          
          toast({
            title: "Berhasil!",
            description: `${studentsData.length} siswa berhasil diimpor`,
          });
          fetchStudents();
        }
      } catch (error: any) {
        console.error('Error importing students:', error);
        toast({
          title: "Error",
          description: "Gagal mengimpor data siswa. Pastikan format CSV benar.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = "NIK,NIS,Nama,Kelas\n1234567890123456,12345,Contoh Siswa,1A";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Akses ditolak. Hanya admin yang dapat mengelola data siswa.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Data Siswa</h2>
          <p className="text-gray-600">Kelola data siswa dengan NIK dan NIS</p>
        </div>
        
        <div className="flex gap-2">
          <ImportExportButtons 
            onImport={handleImport}
            onDownloadTemplate={downloadTemplate}
          />
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent ? 'Perbarui informasi siswa' : 'Masukkan informasi siswa baru'}
                </DialogDescription>
              </DialogHeader>
              
              <StudentForm
                student={editingStudent}
                classes={classes}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Siswa</CardTitle>
          <CardDescription>
            Total: {students.length} siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentTable
            students={students}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManager;
