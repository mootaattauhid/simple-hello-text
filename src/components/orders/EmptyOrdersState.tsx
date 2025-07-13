
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

export const EmptyOrdersState = () => (
  <Card className="text-center py-12">
    <CardContent>
      <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <CardTitle className="text-xl mb-2">Belum Ada Pesanan</CardTitle>
      <CardDescription className="mb-4">
        Mulai pesan makanan untuk anak Anda
      </CardDescription>
      <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
        Mulai Pesan
      </Button>
    </CardContent>
  </Card>
);
