
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface StudentFormProps {
  student?: Student | null;
  classes: Class[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, classes, onSubmit, onCancel }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nik">NIK *</Label>
        <Input
          id="nik"
          name="nik"
          required
          maxLength={16}
          defaultValue={student?.nik || ''}
          placeholder="16 digit NIK"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="nis">NIS</Label>
        <Input
          id="nis"
          name="nis"
          defaultValue={student?.nis || ''}
          placeholder="Nomor Induk Siswa (opsional)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nama Siswa *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={student?.name || ''}
          placeholder="Masukkan nama lengkap siswa"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="className">Kelas</Label>
        <Select name="className" defaultValue={student?.class_name || 'no-class'}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-class">Tidak ada kelas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.name}>
                {cls.name} - {cls.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          {student ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
