
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Navbar } from '@/components/Navbar';

interface Child {
  id: string;
  name: string;
  class_name: string;
  created_at: string;
}

const Children = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const className = formData.get('className') as string;

    try {
      if (editingChild) {
        const { error } = await supabase
          .from('children')
          .update({
            name,
            class_name: className,
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
            class_name: className,
          });

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Anak berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingChild(null);
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
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingChild ? 'Edit Data Anak' : 'Tambah Anak Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingChild ? 'Perbarui informasi anak' : 'Masukkan informasi anak untuk pemesanan makanan'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Anak</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingChild?.name || ''}
                    placeholder="Masukkan nama anak"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="className">Kelas</Label>
                  <Input
                    id="className"
                    name="className"
                    required
                    defaultValue={editingChild?.class_name || ''}
                    placeholder="Contoh: 1A, 2B, dll"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    {editingChild ? 'Perbarui' : 'Tambah'}
                  </Button>
                </div>
              </form>
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
                <Card key={child.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{child.name}</span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(child)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(child.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Kelas {child.class_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      Ditambahkan: {new Date(child.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
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
    </div>
  );
};

export default Children;
