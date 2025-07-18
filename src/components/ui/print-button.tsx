
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrintButtonProps {
  onPrint: (printerType?: string) => void;
  className?: string;
  label?: string;
  showPrinterOptions?: boolean;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ 
  onPrint, 
  className, 
  label = "Print",
  showPrinterOptions = false 
}) => {
  const [selectedPrinter, setSelectedPrinter] = React.useState<string>('standard');

  const handlePrint = () => {
    onPrint(showPrinterOptions ? selectedPrinter : undefined);
  };

  if (showPrinterOptions) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Pilih Printer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Printer</SelectItem>
            <SelectItem value="thermal">Thermal Printer</SelectItem>
            <SelectItem value="dotmatrix">Dot Matrix Printer</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handlePrint}
          variant="outline"
          className={className}
        >
          <Printer className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      className={className}
    >
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
};
