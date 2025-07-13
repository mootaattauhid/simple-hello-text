
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

interface OrderInfoProps {
  selectedChild: Child | undefined;
  selectedDate: Date;
  getDateStatus: (date: Date) => { status: string; message: string };
}

const OrderInfo = ({ selectedChild, selectedDate, getDateStatus }: OrderInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informasi Pesanan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Anak:</strong> {selectedChild?.name} - Kelas {selectedChild?.class_name}</p>
          <p><strong>Tanggal:</strong> {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
          <Badge className={getDateStatus(selectedDate).status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
            {getDateStatus(selectedDate).message}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderInfo;
