
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderSchedule {
  id: string;
  date: string;
  cutoff_date: string | null;
  cutoff_time: string | null;
  max_orders: number | null;
  current_orders: number | null;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState<OrderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<OrderSchedule | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    cutoff_date: '',
    cutoff_time: '08:00',
    max_orders: '',
    is_blocked: false,
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('order_schedules')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jadwal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        date: formData.date,
        cutoff_date: formData.cutoff_date || null,
        cutoff_time: formData.cutoff_time || '05:00:00',
        max_orders: formData.max_orders ? parseInt(formData.max_orders) : null,
        is_blocked: formData.is_blocked,
        notes: formData.notes || null
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('order_schedules')
          .update(payload)
          .eq('id', editingSchedule.id);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Jadwal berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('order_schedules')
          .insert([payload]);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Jadwal berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jadwal",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (schedule: OrderSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      date: schedule.date,
      cutoff_date: schedule.cutoff_date || '',
      cutoff_time: schedule.cutoff_time?.slice(0, 5) || '05:00',
      max_orders: schedule.max_orders?.toString() || '',
      is_blocked: schedule.is_blocked || false,
      notes: schedule.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('order_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jadwal berhasil dihapus",
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus jadwal",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      cutoff_date: '',
      cutoff_time: '05:00',
      max_orders: '',
      is_blocked: false,
      notes: ''
    });
  };

  const handleAddNew = () => {
    setEditingSchedule(null);
    resetForm();
    setDialogOpen(true);
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Manajemen Jadwal & Kuota
          </h1>
          <p className="text-gray-600">Kelola jadwal pengiriman dan kuota pesanan</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule ? 'Perbarui informasi jadwal' : 'Atur jadwal pengiriman dan kuota pesanan'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Tanggal Pengiriman
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cutoff_date" className="text-right">
                    Batas Tanggal Pesan
                  </Label>
                  <Input
                    id="cutoff_date"
                    type="date"
                    value={formData.cutoff_date}
                    onChange={(e) => setFormData({ ...formData, cutoff_date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cutoff_time" className="text-right">
                    Batas Jam Pesan
                  </Label>
                  <Input
                    id="cutoff_time"
                    type="time"
                    value={formData.cutoff_time}
                    onChange={(e) => setFormData({ ...formData, cutoff_time: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max_orders" className="text-right">
                    Maksimal Pesanan
                  </Label>
                  <Input
                    id="max_orders"
                    type="number"
                    value={formData.max_orders}
                    onChange={(e) => setFormData({ ...formData, max_orders: e.target.value })}
                    className="col-span-3"
                    placeholder="Kosongkan jika tidak terbatas"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_blocked" className="text-right">
                    Blokir Tanggal
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="is_blocked"
                      checked={formData.is_blocked}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_blocked: checked })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Catatan
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="col-span-3"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingSchedule ? 'Perbarui' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className={schedule.is_blocked ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    {formatDateForDisplay(schedule.date)}
                  </CardTitle>
                  <CardDescription>
                    {schedule.is_blocked ? (
                      <Badge variant="destructive">Diblokir</Badge>
                    ) : (
                      <Badge variant="default">Tersedia</Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.cutoff_date && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Batas: {formatDateForDisplay(schedule.cutoff_date)} {schedule.cutoff_time?.slice(0, 5)}</span>
                  </div>
                )}
                
                {schedule.max_orders && (
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      Kuota: {schedule.current_orders || 0}/{schedule.max_orders}
                    </span>
                    <div className="ml-2 flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((schedule.current_orders || 0) / schedule.max_orders) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {schedule.notes && (
                  <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                    {schedule.notes}
                  </p>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schedules.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Jadwal</h3>
            <p className="text-gray-600 mb-4">Mulai atur jadwal pengiriman dan kuota pesanan</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal Pertama
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleManagement;
