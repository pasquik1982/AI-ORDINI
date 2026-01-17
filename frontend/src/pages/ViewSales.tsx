import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const client = createClient();

interface Sale {
  id: number;
  data: string;
  canale_vendita: string;
  categoria_prodotto: string;
  quantita: number;
  prezzo_totale: number | null;
  prezzo_unitario: number;
}

export default function ViewSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [canali, setCanali] = useState<string[]>([]);
  const [selectedCanale, setSelectedCanale] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedCanale, sales]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all sales
      const salesResponse = await client.apiCall.invoke({
        url: '/api/v1/data/vendite',
        method: 'GET',
        data: {}
      });

      // Load channels list
      const canaliResponse = await client.apiCall.invoke({
        url: '/api/v1/data/canali',
        method: 'GET',
        data: {}
      });

      setSales(salesResponse.data.items || []);
      setCanali(canaliResponse.data.canali || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile caricare le vendite: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (selectedCanale === 'all') {
      setFilteredSales(sales);
    } else {
      setFilteredSales(sales.filter(sale => sale.canale_vendita === selectedCanale));
    }
  };

  const clearFilter = () => {
    setSelectedCanale('all');
  };

  const handleDeleteAll = async () => {
    if (deletePassword !== 'CANCELLATUTTO') {
      toast({
        title: 'Errore',
        description: 'Password errata',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/delete-all-vendite',
        method: 'POST',
        data: { password: deletePassword }
      });

      toast({
        title: 'Successo',
        description: response.data.message
      });

      // Reload data
      setShowDeleteDialog(false);
      setDeletePassword('');
      await loadData();
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile eliminare le vendite: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalSales = filteredSales.length;
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantita, 0);
  const totalValue = filteredSales.reduce((sum, sale) => sum + (sale.prezzo_totale || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tutte le Vendite</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedCanale} onValueChange={setSelectedCanale}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtra per canale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i canali</SelectItem>
              {canali.map((canale) => (
                <SelectItem key={canale} value={canale}>
                  {canale}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCanale !== 'all' && (
            <Button variant="outline" onClick={clearFilter}>
              Cancella filtro
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={sales.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina Tutti
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Vendite</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantità Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettaglio Vendite</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna vendita trovata
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Canale</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Prezzo Tot.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>{formatDate(sale.data)}</TableCell>
                      <TableCell className="font-medium">{sale.canale_vendita}</TableCell>
                      <TableCell>{sale.categoria_prodotto}</TableCell>
                      <TableCell className="text-right">{sale.quantita.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.prezzo_unitario)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.prezzo_totale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina tutte le vendite</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente tutte le tue vendite. Questa operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="password">Inserisci la password per confermare:</Label>
            <Input
              id="password"
              type="password"
              placeholder="CANCELLATUTTO"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword('')}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina Tutto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}