import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { client, AnalyticsSummaryResponse } from '../lib/api';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  // Fetch all categories without filters for the dropdown
  const fetchAllCategories = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/analytics/summary',
        method: 'GET',
        data: {},
      });
      const categories = response.data.by_category.map((c: any) => c.categoria);
      setAllCategories(['all', ...categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedYear !== 'all') params.anno = selectedYear;
      if (selectedMonth !== 'all') params.mese = selectedMonth;
      if (selectedCategory !== 'all') params.categoria = selectedCategory;

      const queryString = new URLSearchParams(params).toString();
      const url = `/api/v1/analytics/summary${queryString ? '?' + queryString : ''}`;
      
      const response = await client.apiCall.invoke({
        url,
        method: 'GET',
        data: {},
      });

      setData(response.data);
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

  useEffect(() => {
    fetchAllCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const years = ['all', '2024', '2025', '2026'];
  const months = [
    { value: 'all', label: 'Tutti i mesi' },
    { value: '1', label: 'Gennaio' },
    { value: '2', label: 'Febbraio' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Aprile' },
    { value: '5', label: 'Maggio' },
    { value: '6', label: 'Giugno' },
    { value: '7', label: 'Luglio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Analisi</h1>
        <div className="flex gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year === 'all' ? 'Tutti gli anni' : year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mese" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'Tutte le categorie' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Acquisti</CardTitle>
            <ShoppingCart className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totale_acquisti_quantita.toFixed(0)}</div>
            <p className="text-xs text-gray-500 mt-1">Quantità</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Vendite</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totale_vendite_quantita.toFixed(0)}</div>
            <p className="text-xs text-gray-500 mt-1">Quantità</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valore Acquisti</CardTitle>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.summary.totale_acquisti_valore.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Categorie</CardTitle>
            <Package className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.categorie_count}</div>
            <p className="text-xs text-gray-500 mt-1">Totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Only show if there's data */}
      {data.by_category.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acquisti vs Vendite per Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acquisti_quantita" fill="#ea580c" name="Acquisti" />
                  <Bar dataKey="vendite_quantita" fill="#16a34a" name="Vendite" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valore per Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acquisti_valore" fill="#ea580c" name="Acquisti €" />
                  <Bar dataKey="vendite_valore" fill="#16a34a" name="Vendite €" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No data message */}
      {data.by_category.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nessun dato disponibile per i filtri selezionati
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {data.by_month.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Andamento Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mese"
                  tickFormatter={(value) => months.find((m) => m.value === value.toString())?.label || value}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="acquisti_quantita" stroke="#ea580c" name="Acquisti" />
                <Line type="monotone" dataKey="vendite_quantita" stroke="#16a34a" name="Vendite" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Table */}
      {data.by_category.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-right p-2">Acquisti Qty</th>
                    <th className="text-right p-2">Vendite Qty</th>
                    <th className="text-right p-2">Differenza Qty</th>
                    <th className="text-right p-2">Acquisti €</th>
                    <th className="text-right p-2">Vendite €</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_category.map((cat) => (
                    <tr key={cat.categoria} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{cat.categoria}</td>
                      <td className="text-right p-2">{cat.acquisti_quantita.toFixed(0)}</td>
                      <td className="text-right p-2">{cat.vendite_quantita.toFixed(0)}</td>
                      <td className={`text-right p-2 font-medium ${
                        cat.acquisti_quantita - cat.vendite_quantita > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {(cat.acquisti_quantita - cat.vendite_quantita).toFixed(0)}
                      </td>
                      <td className="text-right p-2">€{cat.acquisti_valore.toFixed(2)}</td>
                      <td className="text-right p-2">€{cat.vendite_valore.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}