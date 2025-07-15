
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useOrderSchedules } from '@/hooks/useOrderSchedules';
import { useChildren } from '@/hooks/useChildren';
import { useDailyMenus } from '@/hooks/useDailyMenus';
import ChildSelector from '@/components/orderFood/ChildSelector';
import DateCalendar from '@/components/orderFood/DateCalendar';
import OrderInfo from '@/components/orderFood/OrderInfo';
import MenuSelection from '@/components/orderFood/MenuSelection';
import FloatingCartButton from '@/components/orderFood/FloatingCartButton';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  child_id: string;
  food_item_id: string;
  image_url?: string;
}

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();
  
  const { orderSchedules, loading, isDateDisabled, getDateStatus } = useOrderSchedules();
  const { children } = useChildren();
  const { dailyMenus, fetchDailyMenus } = useDailyMenus();

  useEffect(() => {
    if (selectedDate) {
      fetchDailyMenus(selectedDate);
    }
  }, [selectedDate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const addToCart = (menu: any) => {
    if (!selectedChild || !selectedDate) {
      toast({
        title: "Pilih anak dan tanggal",
        description: "Mohon pilih anak dan tanggal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Check if date is still available
    if (isDateDisabled(selectedDate)) {
      toast({
        title: "Tanggal tidak tersedia",
        description: "Tanggal yang dipilih sudah tidak bisa dipesan",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const cartItemId = `${menu.food_item_id}-${dateStr}-${selectedChild}`;
    
    const existingItem = cart.find(item => item.id === cartItemId);

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        name: menu.food_items.name,
        price: menu.price,
        quantity: 1,
        date: dateStr,
        child_id: selectedChild,
        food_item_id: menu.food_item_id,
        image_url: menu.food_items.image_url
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Berhasil ditambahkan",
      description: `${menu.food_items.name} ditambahkan ke keranjang`,
    });
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== cartItemId));
    } else {
      setCart(cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartQuantity = (menu: any) => {
    if (!selectedChild || !selectedDate) return 0;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const cartItemId = `${menu.food_item_id}-${dateStr}-${selectedChild}`;
    const item = cart.find(item => item.id === cartItemId);
    return item ? item.quantity : 0;
  };

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalCartPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan menu terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      // Group cart items by date and child
      const ordersByDate = cart.reduce((acc, item) => {
        const key = `${item.date}-${item.child_id}`;
        if (!acc[key]) {
          acc[key] = {
            date: item.date,
            child_id: item.child_id,
            items: []
          };
        }
        acc[key].items.push(item);
        return acc;
      }, {} as any);

      for (const orderGroup of Object.values(ordersByDate) as any[]) {
        const selectedChildData = children.find(c => c.id === orderGroup.child_id);
        const totalAmount = orderGroup.items.reduce((sum: number, item: CartItem) => 
          sum + (item.price * item.quantity), 0
        );

        // Generate unique order ID
        const midtransOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user?.id,
            order_number: midtransOrderId,
            child_name: selectedChildData?.name,
            child_class: selectedChildData?.class_name,
            total_amount: totalAmount,
            delivery_date: orderGroup.date,
            midtrans_order_id: midtransOrderId,
            status: 'pending',
            payment_status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items using the correct menu_item_id from the cart items
        const orderItems = orderGroup.items.map((item: CartItem) => ({
          order_id: order.id,
          menu_item_id: item.food_item_id,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        console.log('Order created successfully:', order);
      }

      toast({
        title: "Pesanan berhasil dibuat",
        description: "Pesanan Anda telah berhasil dibuat",
      });

      // Clear cart
      setCart([]);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pesanan",
        variant: "destructive",
      });
    }
  };

  const selectedChild_data = children.find(c => c.id === selectedChild);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Menu & Pemesanan Katering
        </h1>
        <p className="text-gray-600 text-sm md:text-base">Pilih tanggal dan anak untuk melihat menu yang tersedia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Panel - Child Selection & Calendar */}
        <div className="space-y-4 md:space-y-6">
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onChildSelect={setSelectedChild}
          />

          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            orderSchedules={orderSchedules}
            isDateDisabled={isDateDisabled}
          />

          {/* Selected Info */}
          {selectedChild && selectedDate && (
            <OrderInfo
              selectedChild={selectedChild_data}
              selectedDate={selectedDate}
              getDateStatus={getDateStatus}
            />
          )}
        </div>

        {/* Right Panel - Menu Selection */}
        <div>
          {selectedDate && selectedChild ? (
            <MenuSelection
              selectedDate={selectedDate}
              dailyMenus={dailyMenus}
              getCartQuantity={getCartQuantity}
              isDateDisabled={isDateDisabled}
              addToCart={addToCart}
              updateQuantity={updateQuantity}
              formatPrice={formatPrice}
              selectedChild={selectedChild}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8 md:py-12">
                <CalendarIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-sm md:text-base">Pilih anak dan tanggal untuk melihat menu</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <FloatingCartButton
        cart={cart}
        getTotalCartItems={getTotalCartItems}
        getTotalCartPrice={getTotalCartPrice}
        formatPrice={formatPrice}
        createOrder={createOrder}
      />
    </div>
  );
};

export default Index;
