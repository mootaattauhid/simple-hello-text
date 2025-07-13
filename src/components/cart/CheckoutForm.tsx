
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

interface CheckoutFormProps {
  children: Child[];
  selectedChildId: string;
  onChildSelect: (childId: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const CheckoutForm = ({ children, selectedChildId, onChildSelect, notes, onNotesChange }: CheckoutFormProps) => {
  return (
    <div className="space-y-4">
      {/* Child Selection */}
      <div className="space-y-2">
        <Label htmlFor="child">Pilih Anak</Label>
        <Select value={selectedChildId} onValueChange={onChildSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih anak untuk pesanan ini" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.name} - Kelas {child.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {children.length === 0 && (
          <p className="text-sm text-red-600">
            Tambahkan data anak terlebih dahulu di menu "Anak"
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea
          id="notes"
          placeholder="Catatan khusus untuk pesanan..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CheckoutForm;
