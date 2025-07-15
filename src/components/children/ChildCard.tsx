
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  class_name: string;
  nik?: string;
  nis?: string;
  created_at: string;
}

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{child.name}</span>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(child)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(child.id)}
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
        <div className="space-y-1 text-sm text-gray-600">
          {child.nik && <div>NIK: {child.nik}</div>}
          {child.nis && <div>NIS: {child.nis}</div>}
          <div>Ditambahkan: {new Date(child.created_at).toLocaleDateString('id-ID')}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;
