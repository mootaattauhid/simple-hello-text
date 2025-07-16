
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import ChildForm from '@/components/children/ChildForm';
import ChildCard from '@/components/children/ChildCard';

interface Child {
  id: string;
  name: string;
  class_name: string;
  nik?: string;
  nis?: string;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Student {
  id: string;
  nik: string;
  nis?: string;
  name: string;
  class_name?: string;
}

const Children = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [searchNik, setSearchNik] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { user } = useAuth();

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedChildren,
    goToPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: children,
    itemsPerPage: 12
  });

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchClasses();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
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

  const searchStudentByNik = async () => {
    if (!searchNik.trim()) {
      setSelectedStudent(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('nik', searchNik.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Tidak Ditemukan",
            description: "Siswa dengan NIK tersebut tidak ditemukan",
            variant: "destructive",
          });
        }
        setSelectedStudent(null);
        return;
      }

      setSelectedStudent(data);
      toast({
        title: "Siswa Ditemukan!",
        description: `${data.name} - ${data.class_name || 'Belum ada kelas'}`,
      });
    } catch (error) {
      console.error('Error searching student:', error);
      setSelectedStudent(null);
    }
  };

  const checkNikExists = async (nik: string, excludeChildId?: string) => {
    try {
      let query = supabase
        .from('children')
        .select('id')
        .eq('user_id', user?.id)
        .eq('nik', nik);

      if (excludeChildId) {
        query = query.neq('id', excludeChildId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking NIK:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const className = formData.get('className') as string;
    const nik = formData.get('nik') as string;
    const nis = formData.get('nis') as string;

    // Handle the "no-class" value
    const processedClassName = className === 'no-class' ? null : className || null;

    // Validate NIK format
    if (!nik || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
      toast({
        title: "Error",
        description: "NIK harus berisi tepat 16 digit angka",
        variant: "destructive",
      });
      return;
    }

    // Check if NIK already exists for this user (except when editing the same child)
    const nikExists = await checkNikExists(nik, editingChild?.id);
    if (nikExists) {
      toast({
        title: "Error",
        description: "NIK sudah digunakan untuk anak lain. Gunakan NIK yang berbeda.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingChild) {
        const { error } = await supabase
          .from('children')
          .update({
            name,
            class_name: processedClassName,
            nik,
            nis: nis || null,
          })
          .eq('id', editingChild.id);

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Data anak berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('children')
          .insert({
            user_id: user?.id,
            name,
            class_name: processedClassName,
            nik,
            nis: nis || null,
          });

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Anak berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingChild(null);
      setSelectedStudent(null);
      setSearchNik('');
      fetchChildren();
    } catch (error: any) {
      console.error('Error saving child:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data anak",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setSelectedStudent(null);
    setSearchNik('');
    setIsDialogOpen(true);
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data anak ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;
      
      toast({
        title: "Berhasil!",
        description: "Data anak berhasil dihapus",
      });
      fetchChildren();
    } catch (error: any) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus data anak",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingChild(null);
    setSelectedStudent(null);
    setSearchNik('');
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Data Anak
          </h1>
          <p className="text-gray-600 mt-2">Kelola data anak untuk pemesanan makanan</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingChild ? 'Edit Data Anak' : 'Tambah Anak Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingChild ? 'Perbarui informasi anak' : 'Masukkan informasi anak atau cari berdasarkan NIK. NIK wajib diisi.'}
              </DialogDescription>
            </DialogHeader>
            
            <ChildForm
              child={editingChild}
              classes={classes}
              searchNik={searchNik}
              selectedStudent={selectedStudent}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              onSearchNikChange={setSearchNik}
              onSearchStudent={searchStudentByNik}
            />
          </DialogContent>
        </Dialog>
      </div>

      {children.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2">Belum Ada Data Anak</CardTitle>
            <CardDescription className="mb-4">
              Tambahkan data anak untuk mulai memesan makanan
            </CardDescription>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anak Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            itemLabel="anak"
          />
        </>
      )}
    </div>
  );
};

export default Children;
