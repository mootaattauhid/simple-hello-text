
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';

interface OrderSelectionControlsProps {
  selectedCount: number;
  totalEligible: number;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
}

export const OrderSelectionControls = ({ 
  selectedCount,
  totalEligible,
  onSelectAll,
  onClearSelection
}: OrderSelectionControlsProps) => {
  const allSelected = selectedCount === totalEligible && totalEligible > 0;

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Pilih pesanan:</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectAll(!allSelected)}
        className="flex items-center gap-1"
      >
        {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        {allSelected ? 'Batalkan Semua' : `Pilih Semua (${totalEligible})`}
      </Button>

      {selectedCount > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-1"
          >
            Batal Pilih
          </Button>
          
          <div className="flex items-center text-sm text-gray-600">
            <span>{selectedCount} pesanan dipilih</span>
          </div>
        </>
      )}
    </div>
  );
};
