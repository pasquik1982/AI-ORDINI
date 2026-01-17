import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const client = createClient();

interface Supplier {
  id: number;
  nome: string;
}

export default function AddOrder() {
  const [fornitori, setFornitori] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFornitori, setLoadingFornitori] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fornitore: '',
    data_ordine: '',
    data_consegna: '',
    categoria_prodotto: '',
    quantita: '',
    prezzo_totale: ''
  });

  useEffect(() => {
    loadFornitori();
  }, []);

  const loadFornitori = async () => {
    try {
      setLoadingFornitori(true);
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/all-suppliers',
        method: 'GET',
        data: {}
      });
      setFornitori(response.data.suppliers || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile caricare i fornitori: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingFornitori(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fornitore || !formData.data_ordine || !formData.data_consegna || 
        !formData.categoria_prodotto || !formData.quantita || !formData.prezzo_totale) {
      toast({
        title: 'Errore',
        description: 'Tutti i campi sono obbligatori',
        variant: 'destructive'
      });
      return;
    }

    const quantita = parseFloat(formData.quantita);
    const prezzo_totale = parseFloat(formData.prezzo_totale);

    if (isNaN(quantita) || quantita <= 0) {
      toast({
        title: 'Errore',
        description: 'La quantità deve essere un numero positivo',
        variant: 'destructive'
      });
      return;
    }

    if (isNaN(prezzo_totale) || prezzo_totale <= 0) {
      toast({
        title: 'Errore',
        description: 'Il prezzo totale deve essere un numero positivo',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Create order via backend API
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/create-order',
        method: 'POST',
        data: {
          fornitore: formData.fornitore,
          data_ordine: formData.data_ordine,
          data_consegna: formData.data_consegna,
          categoria_prodotto: formData.categoria_prodotto,
          quantita: quantita,
          prezzo_totale: prezzo_totale
        }
      });

      toast({
        title: 'Successo',
        description: 'Ordine creato con successo'
      });

      // Reset form
      setFormData({
        fornitore: '',
        data_ordine: '',
        data_consegna: '',
        categoria_prodotto: '',
        quantita: '',
        prezzo_totale: ''
      });

      // Navigate to view orders
      navigate('/view-orders');
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile creare l'ordine: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Aggiungi Ordine Manualmente</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Nuovo Ordine Fornitore</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fornitore">Fornitore *</Label>
              {loadingFornitori ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento fornitori...
                </div>
              ) : fornitori.length > 0 ? (
                <Select value={formData.fornitore} onValueChange={(value) => handleChange('fornitore', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fornitore" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornitori.map((fornitore) => (
                      <SelectItem key={fornitore.id} value={fornitore.nome}>
                        {fornitore.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="fornitore"
                    type="text"
                    placeholder="Nome fornitore"
                    value={formData.fornitore}
                    onChange={(e) => handleChange('fornitore', e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Nessun fornitore trovato. Inserisci il nome manualmente o{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => navigate('/add-supplier')}
                    >
                      crea un nuovo fornitore
                    </Button>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_ordine">Data Ordine *</Label>
                <Input
                  id="data_ordine"
                  type="date"
                  value={formData.data_ordine}
                  onChange={(e) => handleChange('data_ordine', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_consegna">Data Consegna *</Label>
                <Input
                  id="data_consegna"
                  type="date"
                  value={formData.data_consegna}
                  onChange={(e) => handleChange('data_consegna', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria_prodotto">Categoria Prodotto *</Label>
              <Input
                id="categoria_prodotto"
                type="text"
                placeholder="Es: Elettronica, Abbigliamento, ecc."
                value={formData.categoria_prodotto}
                onChange={(e) => handleChange('categoria_prodotto', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantita">Quantità *</Label>
                <Input
                  id="quantita"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.quantita}
                  onChange={(e) => handleChange('quantita', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prezzo_totale">Prezzo Totale (€) *</Label>
                <Input
                  id="prezzo_totale"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.prezzo_totale}
                  onChange={(e) => handleChange('prezzo_totale', e.target.value)}
                  required
                />
              </div>
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
                    Crea Ordine
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/view-orders')}
                disabled={loading}
              >
                Annulla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}