
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingCart, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useChildren } from '@/hooks/useChildren';
import ChildSelector from '@/components/orderFood/ChildSelector';
import DateCalendar from '@/components/orderFood/DateCalendar';
import { Navbar } from '@/components/Navbar';
import FloatingCartButton from '@/components/orderFood/FloatingCartButton';
import Cart from '@/components/Cart';
import { CartItem } from '@/types/cart';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_available: boolean;
  category_id: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const Index = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedChildForMenu, setSelectedChildForMenu] = useState<string>(''); // Untuk memilih anak saat menambah menu
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { user } = useAuth();
  const { children } = useChildren();
  const cartOperations = useCartOperations();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    cartOperations.fetchChildren();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_available', true);

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu makanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category_id === selectedCategory);
  }, [menuItems, selectedCategory]);

  const addToCart = (menuItem: MenuItem) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk memesan",
        variant: "destructive",
      });
      return;
    }

    if (children.length === 0) {
      toast({
        title: "Data Anak Diperlukan",
        description: "Silakan tambahkan data anak terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChildForMenu) {
      toast({
        title: "Pilih Anak",
        description: "Silakan pilih anak terlebih dahulu sebelum menambah menu",
        variant: "destructive",
      });
      return;
    }

    const selectedChild = children.find(child => child.id === selectedChildForMenu);
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Data anak tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Cari item yang sama dengan menu, tanggal, dan anak yang sama
    const existingItem = cartItems.find(
      item => item.menu_item_id === menuItem.id && 
               item.date === dateString && 
               item.child_id === selectedChild.id
    );

    if (existingItem) {
      // Jika sudah ada, tambah quantity
      setCartItems(cartItems.map(item =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Jika belum ada, buat item baru
      const newItem: CartItem = {
        id: `${menuItem.id}-${dateString}-${selectedChild.id}-${Date.now()}`,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        image_url: menuItem.image_url || '',
        menu_item_id: menuItem.id,
        date: dateString,
        delivery_date: dateString,
        child_id: selectedChild.id,
        child_name: selectedChild.name,
        child_class: selectedChild.class_name,
      };
      setCartItems([...cartItems, newItem]);
    }

    toast({
      title: "Ditambahkan ke Keranjang",
      description: `${menuItem.name} untuk ${selectedChild.name} berhasil ditambahkan`,
    });
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cartItems.find(item => item.id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCartItems(cartItems.map(item =>
        item.id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCartItems(cartItems.filter(item => item.id !== itemId));
    }
  };

  const getItemQuantityInCart = (menuItemId: string) => {
    if (!selectedChildForMenu) return 0;
    
    const dateString = selectedDate.toISOString().split('T')[0];
    const item = cartItems.find(
      item => item.menu_item_id === menuItemId && 
               item.date === dateString && 
               item.child_id === selectedChildForMenu
    );
    return item?.quantity || 0;
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setIsCartOpen(false);
    toast({
      title: "Checkout Berhasil!",
      description: "Pesanan Anda telah berhasil dibuat",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Selamat Datang di Kantin Sekolah
          </h1>
          <p className="text-gray-600 text-lg">
            Pesan makanan untuk anak Anda dengan mudah dan praktis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ChildSelector 
              children={children}
              selectedChild={selectedChildForMenu}
              onChildSelect={setSelectedChildForMenu}
            />
            
            <DateCalendar 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              orderSchedules={[]}
              isDateDisabled={() => false}
            />

            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kategori Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  Semua Menu
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            {!selectedChildForMenu && children.length > 0 && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <p className="text-orange-700 text-center">
                    <Calendar className="h-5 w-5 inline mr-2" />
                    Pilih anak terlebih dahulu untuk menambahkan menu ke keranjang
                  </p>
                </CardContent>
              </Card>
            )}

            {filteredMenuItems.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 mb-4">Tidak ada menu tersedia</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => {
                  const quantity = getItemQuantityInCart(item.id);
                  
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {item.image_url && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{item.name}</CardTitle>
                          {item.categories && (
                            <Badge variant="secondary" className="ml-2">
                              {item.categories.name}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <CardDescription>{item.description}</CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-orange-600">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {quantity > 0 && selectedChildForMenu ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const dateString = selectedDate.toISOString().split('T')[0];
                                    const cartItem = cartItems.find(
                                      cartItem => cartItem.menu_item_id === item.id && 
                                                  cartItem.date === dateString && 
                                                  cartItem.child_id === selectedChildForMenu
                                    );
                                    if (cartItem) {
                                      removeFromCart(cartItem.id);
                                    }
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold min-w-[2rem] text-center">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addToCart(item)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => addToCart(item)}
                                disabled={!selectedChildForMenu}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && (
        <FloatingCartButton
          itemCount={totalCartItems}
          onClick={() => setIsCartOpen(true)}
        />
      )}

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckoutSuccess}
        cartOperations={cartOperations}
      />
    </div>
  );
};

export default Index;
