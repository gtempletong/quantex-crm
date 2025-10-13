'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Search, Download, RefreshCw } from 'lucide-react';

interface ChartData {
  time: string;
  value: number;
}

interface SeriesData {
  ticker: string;
  data: ChartData[];
  metadata: {
    ticker: string;
    name: string;
    unit: string;
    source: string;
    last_update: string;
  };
}

interface AvailableSeries {
  ticker: string;
  name: string;
  unit: string;
  last_update: string;
}

// Declarar TradingView como global
declare global {
  interface Window {
    LightweightCharts: any;
  }
}

export default function ChartsPage() {
  const [availableSeries, setAvailableSeries] = useState<AvailableSeries[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [chartData, setChartData] = useState<SeriesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [days, setDays] = useState(365);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Cargar TradingView y series disponibles
  useEffect(() => {
    loadTradingViewScript();
    fetchAvailableSeries();
  }, []);

  // Crear gráfico cuando los datos cambien
  useEffect(() => {
    if (chartData.length > 0 && tradingViewLoaded && chartContainerRef.current) {
      createChart();
    }
  }, [chartData, tradingViewLoaded]);

  const loadTradingViewScript = () => {
    if (window.LightweightCharts) {
      setTradingViewLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.onload = () => {
      setTradingViewLoaded(true);
      console.log('✅ TradingView Lightweight Charts cargado');
    };
    script.onerror = () => {
      setError('Error cargando TradingView Lightweight Charts');
    };
    document.head.appendChild(script);
  };

  const createChart = () => {
    if (!chartContainerRef.current || !window.LightweightCharts) {
      console.error('❌ TradingView no disponible o contenedor no encontrado');
      return;
    }

    // Limpiar gráfico anterior
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    console.log('📊 Creando gráfico TradingView...');

    let chart: any;
    try {
      // Crear nuevo gráfico usando la API correcta con 2 escalas
      const containerHeight = chartContainerRef.current.clientHeight;
      chart = window.LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: containerHeight,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#cccccc',
          visible: true,
        },
        leftPriceScale: {
          borderColor: '#cccccc',
          visible: true, // Activar escala izquierda
        },
        timeScale: {
          borderColor: '#cccccc',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      console.log('✅ Gráfico creado exitosamente');

      // Agregar series al gráfico con escalas alternadas
      const colors = ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#FF5722'];
      
      chartData.forEach((series, index) => {
        try {
          // Alternar entre escala derecha (right) e izquierda (left)
          const priceScaleId = index % 2 === 0 ? 'right' : 'left';
          
          // Crear serie de línea usando la API correcta de TradingView
          const lineSeries = (chart as any).addSeries(window.LightweightCharts.LineSeries, {
            color: colors[index % colors.length],
            lineWidth: 2,
            title: series.ticker,
            priceScaleId: priceScaleId, // Asignar a escala derecha o izquierda
          });

          // Formatear datos para TradingView (usar formato string como el original)
          const formattedData = series.data.map((point, index) => {
            const formattedPoint = {
              time: point.time, // Mantener como string YYYY-MM-DD
              value: point.value,
            };
            
            // Debug: mostrar los primeros puntos
            if (index < 3) {
              console.log(`🔍 Punto ${index} original:`, point);
              console.log(`🔍 Punto ${index} formateado:`, formattedPoint);
            }
            
            return formattedPoint;
          });

          console.log(`📊 Datos formateados para ${series.ticker}:`, {
            totalPoints: formattedData.length,
            firstPoint: formattedData[0],
            lastPoint: formattedData[formattedData.length - 1]
          });

          lineSeries.setData(formattedData);
          console.log(`✅ Serie ${series.ticker} agregada con ${formattedData.length} puntos`);
        } catch (seriesError) {
          console.error(`❌ Error agregando serie ${series.ticker}:`, seriesError);
        }
      });

      // Responsive
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
        const newRect = entries[0].contentRect;
        (chart as any).applyOptions({ width: newRect.width, height: newRect.height });
      });

      resizeObserver.observe(chartContainerRef.current);

      chartInstanceRef.current = chart;

    } catch (chartError: any) {
      console.error('❌ Error creando gráfico:', chartError);
      setError(`Error creando gráfico: ${chartError.message}`);
      return;
    }
  };

  const fetchAvailableSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/charts/series');
      const result = await response.json();
      
      if (result.success) {
        setAvailableSeries(result.series || []);
      } else {
        setError(result.error || 'Error cargando series disponibles');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    if (selectedTickers.length === 0) {
      setError('Selecciona al menos un ticker');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tickersParam = selectedTickers.join(',');
      console.log(`📊 Cargando datos para tickers: ${tickersParam}, días: ${days}`);
      
      const response = await fetch(`/api/charts/batch?tickers=${tickersParam}&days=${days}`);
      const result = await response.json();

      console.log('📋 Respuesta de la API:', result);

      if (result.success) {
        const dataArray = Object.entries(result.series).map(([ticker, data]: [string, any]) => ({
          ticker,
          ...data
        }));
        
        console.log('📈 Datos procesados para el gráfico:', dataArray);
        
        // Debug: mostrar los primeros puntos de datos
        dataArray.forEach(series => {
          console.log(`🔍 Serie ${series.ticker}:`, {
            dataLength: series.data?.length || 0,
            firstPoint: series.data?.[0],
            lastPoint: series.data?.[series.data?.length - 1],
            metadata: series.metadata
          });
        });
        
        setChartData(dataArray);
      } else {
        setError(result.error || 'Error cargando datos de gráficos');
      }
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };


  const filteredSeries = availableSeries.filter(series =>
    series.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    series.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 size={32} />
            Charts Financieros
          </h1>
          <p className="text-gray-600 mt-2">
            Visualiza datos financieros y series temporales
          </p>
        </div>
        <button
          onClick={fetchAvailableSeries}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Actualizar Series
        </button>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Selección de Series MÚLTIPLES */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Series (Ctrl/Cmd + Click para múltiples)
            </label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: '120px' }}
              value={selectedTickers}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions);
                const values = options.map(option => option.value);
                setSelectedTickers(values);
              }}
            >
              {filteredSeries.map((series) => (
                <option key={series.ticker} value={series.ticker}>
                  {series.ticker} - {series.name}
                </option>
              ))}
            </select>
            {selectedTickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTickers.map(ticker => (
                  <span
                    key={ticker}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {ticker}
                    <button
                      onClick={() => setSelectedTickers(prev => prev.filter(t => t !== ticker))}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Días */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período (días)
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
              <option value={180}>6 meses</option>
              <option value={365}>1 año</option>
              <option value={730}>2 años</option>
            </select>
          </div>

          {/* Botón Cargar */}
          <div className="flex items-end">
            <button
              onClick={loadChartData}
              disabled={loading || selectedTickers.length === 0}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Cargar Gráfico ({selectedTickers.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Gráfico Principal */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm font-medium text-gray-900">
                {chartData.map((series, index) => {
                  const scalePosition = index % 2 === 0 ? 'Derecha' : 'Izquierda';
                  return (
                    <div key={series.ticker} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0', '#FF5722'][index % 5] }}
                      ></div>
                      <span>{series.ticker}</span>
                      <span className="text-xs text-gray-500">({scalePosition})</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">
                📊 Dos escalas independientes
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* Contenedor del gráfico TradingView - USANDO MEJOR EL ESPACIO */}
            <div 
              ref={chartContainerRef}
              className="bg-white rounded-lg border-2 border-gray-200 w-full"
              style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
            />
            
            {/* Información adicional - más compacta */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600">
              {chartData.map((series) => (
                <div key={series.ticker} className="bg-gray-50 p-2 rounded-lg">
                  <div className="font-medium text-gray-900 text-xs">{series.ticker}</div>
                  <div className="text-xs">Puntos: {series.data.length}</div>
                  <div className="text-xs">Fuente: {series.metadata.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TradingView Status */}
      {!tradingViewLoaded && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Cargando TradingView...</span>
            <span>Esperando librería de gráficos</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
