import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const client = createClient();

interface Supplier {
  id: number;
  nome: string;
}

export default function AddSupplier() {
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/all-suppliers',
        method: 'GET',
        data: {}
      });
      setSuppliers(response.data.suppliers || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile caricare i fornitori: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nome || formData.nome.trim() === '') {
      toast({
        title: 'Errore',
        description: 'Il nome del fornitore è obbligatorio',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Create supplier via backend API
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/create-supplier',
        method: 'POST',
        data: {
          nome: formData.nome.trim()
        }
      });

      toast({
        title: 'Successo',
        description: 'Fornitore creato con successo'
      });

      // Reset form
      setFormData({
        nome: ''
      });

      // Reload suppliers list
      await loadSuppliers();
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile creare il fornitore: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    try {
      setDeleting(true);

      await client.apiCall.invoke({
        url: '/api/v1/data/delete-supplier',
        method: 'POST',
        data: {
          supplier_id: supplierToDelete.id
        }
      });

      toast({
        title: 'Successo',
        description: 'Fornitore eliminato con successo'
      });

      // Reload suppliers list
      await loadSuppliers();
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile eliminare il fornitore: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleChange = (value: string) => {
    setFormData({ nome: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestione Fornitori</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Aggiungi Nuovo Fornitore</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Fornitore *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Es: Fornitore ABC S.r.l."
                value={formData.nome}
                onChange={(e) => handleChange(e.target.value)}
                required
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Inserisci il nome completo del fornitore
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Fornitore
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/add-order')}
                disabled={loading}
              >
                Vai ad Aggiungi Ordine
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Fornitori Esistenti</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSuppliers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Caricamento fornitori...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun fornitore trovato. Crea il primo fornitore usando il form sopra.
            </div>
          ) : (
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{supplier.nome}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(supplier)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il fornitore "{supplierToDelete?.nome}"?
              <br />
              <br />
              <strong className="text-red-600">
                Attenzione: Tutti gli ordini associati a questo fornitore verranno eliminati.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}