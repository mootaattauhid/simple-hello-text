
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onPrint: () => void;
  className?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ onPrint, className }) => {
  return (
    <Button
      onClick={onPrint}
      variant="outline"
      className={className}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
};
