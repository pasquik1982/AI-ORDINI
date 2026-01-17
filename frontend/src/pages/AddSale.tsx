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

export default function AddSale() {
  const [canali, setCanali] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCanali, setLoadingCanali] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    data: '',
    canale_vendita: '',
    categoria_prodotto: '',
    quantita: '',
    prezzo_totale: ''
  });

  useEffect(() => {
    loadCanali();
  }, []);

  const loadCanali = async () => {
    try {
      setLoadingCanali(true);
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/canali',
        method: 'GET',
        data: {}
      });
      setCanali(response.data.canali || []);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile caricare i canali: ${detail}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingCanali(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.data || !formData.canale_vendita || !formData.categoria_prodotto || 
        !formData.quantita || !formData.prezzo_totale) {
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

      // Create sale via backend API
      const response = await client.apiCall.invoke({
        url: '/api/v1/data/create-sale',
        method: 'POST',
        data: {
          data: formData.data,
          canale_vendita: formData.canale_vendita,
          categoria_prodotto: formData.categoria_prodotto,
          quantita: quantita,
          prezzo_totale: prezzo_totale
        }
      });

      toast({
        title: 'Successo',
        description: 'Vendita creata con successo'
      });

      // Reset form
      setFormData({
        data: '',
        canale_vendita: '',
        categoria_prodotto: '',
        quantita: '',
        prezzo_totale: ''
      });

      // Navigate to view sales
      navigate('/view-sales');
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: `Impossibile creare la vendita: ${detail}`,
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
        <h1 className="text-3xl font-bold">Aggiungi Vendita Manualmente</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Nuova Vendita</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data Vendita *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleChange('data', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canale_vendita">Canale di Vendita *</Label>
              {loadingCanali ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento canali...
                </div>
              ) : canali.length > 0 ? (
                <Select value={formData.canale_vendita} onValueChange={(value) => handleChange('canale_vendita', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona canale" />
                  </SelectTrigger>
                  <SelectContent>
                    {canali.map((canale) => (
                      <SelectItem key={canale} value={canale}>
                        {canale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="canale_vendita"
                  type="text"
                  placeholder="Es: Online, Negozio Fisico, ecc."
                  value={formData.canale_vendita}
                  onChange={(e) => handleChange('canale_vendita', e.target.value)}
                  required
                />
              )}
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
                    Crea Vendita
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/view-sales')}
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