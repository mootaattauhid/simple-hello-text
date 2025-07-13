
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { populateDailyMenus } from '@/utils/populateDailyMenus';

const PopulateDailyMenus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePopulate = async () => {
    setIsLoading(true);
    try {
      await populateDailyMenus();
      toast({
        title: "Berhasil",
        description: "Menu harian berhasil dibuat untuk 7 hari ke depan",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Gagal membuat menu harian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Populate Daily Menus</CardTitle>
          <CardDescription>
            Buat menu harian untuk 7 hari ke depan berdasarkan food items yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handlePopulate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Memproses...' : 'Buat Menu Harian'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopulateDailyMenus;
