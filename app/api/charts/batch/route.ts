import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers');
    const days = searchParams.get('days') || '365';
    
    if (!tickers) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro tickers requerido'
      }, { status: 400 });
    }
    
    const supabase = getServerSupabase();
    const tickerList = tickers.split(',').map(t => t.trim()).filter(t => t);
    const daysNumber = parseInt(days, 10);
    
    // Calcular fecha de inicio
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysNumber);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const results: any = {};
    
    // Obtener datos para cada ticker usando el mismo método que charts_app.py
    for (const ticker of tickerList) {
      try {
        let foundData = false;

        // 1. Intentar desde instrument_definitions -> market_data_ohlcv
        const { data: instrumentDef } = await supabase
          .from('instrument_definitions')
          .select('id, ticker')
          .ilike('ticker', ticker)
          .single();

        if (instrumentDef) {
          const { data: marketData } = await supabase
            .from('market_data_ohlcv')
            .select('timestamp, close')
            .ilike('ticker', ticker)
            .gte('timestamp', startDateStr)
            .order('timestamp', { ascending: true });

          if (marketData && marketData.length > 0) {
            const formattedData = marketData.map(point => ({
              time: point.timestamp,
              value: parseFloat(point.close.toString())
            }));

            results[ticker] = {
              data: formattedData,
              metadata: {
                ticker: ticker,
                name: ticker,
                unit: 'CLP',
                source: 'quantex',
                last_update: formattedData[formattedData.length - 1]?.time + 'T00:00:00Z' || new Date().toISOString()
              }
            };
            foundData = true;
          }
        }

        // 2. Si no encontramos datos, intentar desde fixed_income_definitions -> fixed_income_trades
        if (!foundData) {
          const { data: fixedIncomeDef } = await supabase
            .from('fixed_income_definitions')
            .select('id, ticker')
            .ilike('ticker', ticker)
            .single();

          if (fixedIncomeDef) {
            const { data: fixedIncomeData } = await supabase
              .from('fixed_income_trades')
              .select('trade_date, average_yield')
              .eq('instrument_id', fixedIncomeDef.id)
              .gte('trade_date', startDateStr)
              .order('trade_date', { ascending: true });

            if (fixedIncomeData && fixedIncomeData.length > 0) {
              const formattedData = fixedIncomeData.map(point => ({
                time: point.trade_date,
                value: parseFloat(point.average_yield.toString())
              }));

              results[ticker] = {
                data: formattedData,
                metadata: {
                  ticker: ticker,
                  name: ticker,
                  unit: 'percentage',
                  source: 'fixed_income_trades',
                  last_update: formattedData[formattedData.length - 1]?.time + 'T00:00:00Z' || new Date().toISOString()
                }
              };
              foundData = true;
            }
          }
        }

        // 3. Si no encontramos datos, intentar desde series_definitions -> time_series_data
        if (!foundData) {
          const { data: seriesDef } = await supabase
            .from('series_definitions')
            .select('id, ticker')
            .ilike('ticker', ticker)
            .single();

          if (seriesDef) {
            const { data: timeSeriesData } = await supabase
              .from('time_series_data')
              .select('timestamp, value')
              .eq('series_id', seriesDef.id)
              .gte('timestamp', startDateStr)
              .order('timestamp', { ascending: true });

            if (timeSeriesData && timeSeriesData.length > 0) {
              const formattedData = timeSeriesData.map(point => ({
                time: point.timestamp,
                value: parseFloat(point.value.toString())
              }));

              results[ticker] = {
                data: formattedData,
                metadata: {
                  ticker: ticker,
                  name: ticker,
                  unit: 'CLP',
                  source: 'quantex',
                  last_update: formattedData[formattedData.length - 1]?.time + 'T00:00:00Z' || new Date().toISOString()
                }
              };
              foundData = true;
            }
          }
        }

        // 4. Si no se encontraron datos en ninguna tabla
        if (!foundData) {
          results[ticker] = {
            error: `No se encontraron datos para ${ticker}`
          };
        }

      } catch (error: any) {
        results[ticker] = {
          error: `Error obteniendo ${ticker}: ${error.message}`
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      series: results
    });
    
  } catch (error: any) {
    console.error('Error fetching batch chart data:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo datos de gráficos'
    }, { status: 500 });
  }
}