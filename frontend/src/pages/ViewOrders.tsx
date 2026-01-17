import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
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

interface Order {
  id: number;
  fornitore: string;
  data_ordine: string;
  data_consegna: string;
  categoria_prodotto: string;
  quantita: number;
  prezzo_totale: number;
  prezzo_unitario: number;
}

export default function ViewOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [fornitori, setFornitori] = useState<string[]>([]);
  const [selectedFornitore, setSelectedFornitore] = useState<string>('all');
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
  }, [selectedFornitore, orders]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all orders
      const ordersResponse = await client.apiCall.invoke({
        url: '/api/v1/data/acquisti',
        method: 'GET',
        data: {}
      });

      // Load suppliers list
      const fornitoriResponse = await client.apiCall.invoke({
        url: '/api/v1/data/fornitori',
        method: 'GET',
        data: {}
      });

      setOrders(ordersResponse.data.items || []);
      setFornitori(fornitoriResponse.data.fornitori || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile caricare gli ordini: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (selectedFornitore === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.fornitore === selectedFornitore));
    }
  };

  const clearFilter = () => {
    setSelectedFornitore('all');
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
        url: '/api/v1/data/delete-all-acquisti',
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
        description: `Impossibile eliminare gli ordini: ${detail}`,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalOrders = filteredOrders.length;
  const totalQuantity = filteredOrders.reduce((sum, order) => sum + order.quantita, 0);
  const totalValue = filteredOrders.reduce((sum, order) => sum + order.prezzo_totale, 0);

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
        <h1 className="text-3xl font-bold">Tutti gli Ordini</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedFornitore} onValueChange={setSelectedFornitore}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtra per fornitore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i fornitori</SelectItem>
              {fornitori.map((fornitore) => (
                <SelectItem key={fornitore} value={fornitore}>
                  {fornitore}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFornitore !== 'all' && (
            <Button variant="outline" onClick={clearFilter}>
              Cancella filtro
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={orders.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina Tutti
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Ordini</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
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
          <CardTitle>Dettaglio Ordini</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Prezzo Tot.</TableHead>
                    <TableHead>Data Ordine</TableHead>
                    <TableHead>Data Consegna</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell className="font-medium">{order.fornitore}</TableCell>
                      <TableCell>{order.categoria_prodotto}</TableCell>
                      <TableCell className="text-right">{order.quantita.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.prezzo_unitario)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.prezzo_totale)}</TableCell>
                      <TableCell>{formatDate(order.data_ordine)}</TableCell>
                      <TableCell>{formatDate(order.data_consegna)}</TableCell>
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
            <AlertDialogTitle>Elimina tutti gli ordini</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente tutti i tuoi ordini. Questa operazione non può essere annullata.
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