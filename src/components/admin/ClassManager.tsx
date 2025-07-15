
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

interface Class {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

const ClassManager = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin) {
      fetchClasses();
    }
  }, [isAdmin]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
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
    const description = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'on';

    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({
            name,
            description: description || null,
            is_active: isActive,
          })
          .eq('id', editingClass.id);

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Data kelas berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            name,
            description: description || null,
            is_active: isActive,
          });

        if (error) throw error;
        toast({
          title: "Berhasil!",
          description: "Kelas berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingClass(null);
      fetchClasses();
    } catch (error: any) {
      console.error('Error saving class:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data kelas",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData);
    setIsDialogOpen(true);
  };

  const handleDelete = async (classId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      
      toast({
        title: "Berhasil!",
        description: "Kelas berhasil dihapus",
      });
      fetchClasses();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus kelas",
        variant: "destructive",
      });
    }
  };

  const toggleClassStatus = async (classId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !currentStatus })
        .eq('id', classId);

      if (error) throw error;
      
      toast({
        title: "Berhasil!",
        description: `Kelas berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      fetchClasses();
    } catch (error: any) {
      console.error('Error toggling class status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status kelas",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setIsDialogOpen(false);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Akses ditolak. Hanya admin yang dapat mengelola kelas.</p>
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
          <h2 className="text-2xl font-bold">Manajemen Kelas</h2>
          <p className="text-gray-600">Kelola daftar kelas yang tersedia</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingClass ? 'Perbarui informasi kelas' : 'Masukkan informasi kelas baru'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kelas *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingClass?.name || ''}
                  placeholder="Contoh: 1A, 2B, dll"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingClass?.description || ''}
                  placeholder="Deskripsi kelas (opsional)"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={editingClass?.is_active ?? true} 
                />
                <Label htmlFor="isActive">Kelas Aktif</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  {editingClass ? 'Perbarui' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>
            Total: {classes.length} kelas ({classes.filter(c => c.is_active).length} aktif)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classData) => (
                <TableRow key={classData.id}>
                  <TableCell className="font-medium">{classData.name}</TableCell>
                  <TableCell>{classData.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={classData.is_active}
                        onCheckedChange={() => toggleClassStatus(classData.id, classData.is_active)}
                      />
                      <span className={classData.is_active ? 'text-green-600' : 'text-gray-500'}>
                        {classData.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(classData)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(classData.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassManager;
