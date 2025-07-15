
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';

interface ImportExportButtonsProps {
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({ onImport, onDownloadTemplate }) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onDownloadTemplate}>
        <Download className="h-4 w-4 mr-2" />
        Download Template
      </Button>
      
      <div>
        <input
          type="file"
          accept=".csv"
          onChange={onImport}
          className="hidden"
          id="import-csv"
        />
        <Button variant="outline" onClick={() => document.getElementById('import-csv')?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>
    </div>
  );
};

export default ImportExportButtons;
