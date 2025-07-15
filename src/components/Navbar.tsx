
import React from 'react';
import {
  Home,
  BarChart3,
  ShoppingCart,
  Calendar,
  UtensilsCrossed,
  FileText,
  Users,
  Plus,
  TrendingUp,
  UserCog,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { role: userRole } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: BarChart3 },
        { path: '/admin/food-management', label: 'Kelola Menu', icon: UtensilsCrossed },
        { path: '/admin/order-management', label: 'Kelola Pesanan', icon: ShoppingCart },
        { path: '/admin/order-recap', label: 'Rekapitulasi', icon: FileText },
        { path: '/admin/reports', label: 'Laporan', icon: TrendingUp },
        { path: '/admin/schedule-management', label: 'Jadwal', icon: Calendar },
        { path: '/admin/populate-daily-menus', label: 'Isi Menu Harian', icon: Plus },
        { path: '/admin/user-management', label: 'Kelola Pengguna', icon: UserCog },
        { path: '/admin/student-management', label: 'Kelola Siswa', icon: GraduationCap },
      ];
    } else if (userRole === 'cashier') {
      return [
        { path: '/cashier', label: 'Dashboard Kasir', icon: BarChart3 },
        { path: '/cashier/reports', label: 'Laporan Kasir', icon: FileText },
      ];
    } else {
      return [
        { path: '/', label: 'Beranda', icon: Home },
        { path: '/orders', label: 'Pesanan Saya', icon: ShoppingCart },
        { path: '/children', label: 'Data Anak', icon: Users },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-orange-500">
          Kantin App
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 ${location.pathname === item.path ? 'bg-gray-100 font-medium' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                  <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden">
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-2 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 ${location.pathname === item.path ? 'bg-gray-100 font-medium' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button variant="outline" onClick={handleSignOut}>
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
