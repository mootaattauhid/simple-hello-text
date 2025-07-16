
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

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

interface ChildFormProps {
  child?: Child | null;
  classes: Class[];
  searchNik: string;
  selectedStudent: Student | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onSearchNikChange: (nik: string) => void;
  onSearchStudent: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({
  child,
  classes,
  searchNik,
  selectedStudent,
  onSubmit,
  onCancel,
  onSearchNikChange,
  onSearchStudent,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!child && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <Label>Cari Siswa Berdasarkan NIK (Opsional)</Label>
          <div className="flex space-x-2">
            <Input
              value={searchNik}
              onChange={(e) => onSearchNikChange(e.target.value)}
              placeholder="Masukkan NIK siswa"
              maxLength={16}
            />
            <Button type="button" onClick={onSearchStudent} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {selectedStudent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800">
                Siswa Ditemukan: {selectedStudent.name}
              </p>
              <p className="text-sm text-green-600">
                NIK: {selectedStudent.nik} | NIS: {selectedStudent.nis || '-'} | Kelas: {selectedStudent.class_name || '-'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Anak *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={child?.name || selectedStudent?.name || ''}
          placeholder="Masukkan nama anak"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="className">Kelas *</Label>
        <Select name="className" defaultValue={child?.class_name || selectedStudent?.class_name || 'no-class'}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-class">Tidak ada kelas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.name}>
                {cls.name} {cls.description && `- ${cls.description}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nik">NIK *</Label>
        <Input
          id="nik"
          name="nik"
          required
          maxLength={16}
          pattern="[0-9]{16}"
          defaultValue={child?.nik || selectedStudent?.nik || ''}
          placeholder="16 digit NIK (wajib diisi)"
          title="NIK harus berisi 16 digit angka"
        />
        <p className="text-xs text-gray-500">NIK harus berisi tepat 16 digit angka</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nis">NIS</Label>
        <Input
          id="nis"
          name="nis"
          defaultValue={child?.nis || selectedStudent?.nis || ''}
          placeholder="Nomor Induk Siswa (opsional)"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          {child ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default ChildForm;
