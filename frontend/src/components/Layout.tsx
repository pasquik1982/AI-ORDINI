import { Link, useNavigate } from 'react-router-dom';
import { Home, Upload, FileText, ShoppingCart, Package, LogOut, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('custom_auth_token');
    localStorage.removeItem('custom_auth_username');
    toast({
      title: 'Disconnesso',
      description: 'Sei stato disconnesso con successo'
    });
    navigate('/login');
  };

  const username = localStorage.getItem('custom_auth_username') || 'Utente';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Gestionale</h1>
          <p className="text-sm text-gray-500">Ordini & Vendite</p>
        </div>

        <nav className="px-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Importa Dati</p>
          </div>

          <Link
            to="/import-orders"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>Ordini Fornitori</span>
          </Link>

          <Link
            to="/import-sales"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Vendite</span>
          </Link>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Inserimento Manuale</p>
          </div>

          <Link
            to="/add-supplier"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Aggiungi Fornitore</span>
          </Link>

          <Link
            to="/add-order"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Aggiungi Ordine</span>
          </Link>

          <Link
            to="/add-sale"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Aggiungi Vendita</span>
          </Link>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Visualizza Dati</p>
          </div>

          <Link
            to="/view-orders"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Package className="h-5 w-5" />
            <span>Tutti gli Ordini</span>
          </Link>

          <Link
            to="/view-sales"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Tutte le Vendite</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{username}</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}