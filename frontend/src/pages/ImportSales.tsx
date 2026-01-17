import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { client, ParsedSalesRow } from '../lib/api';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportSales() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Content = event.target?.result as string;
        const base64Data = base64Content.split(',')[1];

        const response = await client.apiCall.invoke({
          url: '/api/v1/upload/parse-sales',
          method: 'POST',
          data: {
            file_content: base64Data,
            file_name: file.name,
          },
        });

        setParsedData(response.data.rows);
        toast({
          title: 'Successo',
          description: `${response.data.total_rows} righe analizzate correttamente`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: detail,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const importData = async () => {
    if (parsedData.length === 0) return;

    try {
      setImporting(true);
      
      const response = await client.apiCall.invoke({
        url: '/api/v1/upload/import-sales',
        method: 'POST',
        data: {
          rows: parsedData,
        },
      });

      toast({
        title: 'Importazione completata',
        description: response.data.message,
      });

      // Reset
      setFile(null);
      setParsedData([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      const detail = error?.data?.detail || error?.response?.data?.detail || error.message;
      toast({
        title: 'Errore',
        description: detail,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Vendite</h1>
        <p className="text-gray-600 mt-2">
          Carica file CSV o Excel contenenti i dati delle vendite (supporta file multi-tab)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carica File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={parseFile}
              disabled={!file || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analisi...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analizza File
                </>
              )}
            </Button>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>File selezionato: {file.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anteprima Dati ({parsedData.length} righe)</CardTitle>
              <Button
                onClick={importData}
                disabled={importing}
                className="bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importazione...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Conferma Importazione
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Canale Vendita</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-right p-2">Quantità</th>
                      <th className="text-right p-2">Prezzo €</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(row.data).toLocaleDateString('it-IT')}</td>
                        <td className="p-2">{row.canale_vendita}</td>
                        <td className="p-2">{row.categoria_prodotto}</td>
                        <td className="text-right p-2">{row.quantita}</td>
                        <td className="text-right p-2">
                          {row.prezzo_totale ? `€${row.prezzo_totale.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Mostrate prime 10 righe di {parsedData.length}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}