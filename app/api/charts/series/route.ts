import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServerSupabase();

    // Obtener series usando el mismo método que charts_app.py
    const tickers: any[] = [];

    // 1. series_definitions
    try {
      const { data: seriesData } = await supabase
        .from('series_definitions')
        .select('ticker')
        .order('ticker', { ascending: true });

      if (seriesData) {
        seriesData.forEach(r => {
          const t = r.ticker;
          if (t) {
            tickers.push({ ticker: t });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching series_definitions:', error);
    }

    // 2. instrument_definitions (OHLCV)
    try {
      const { data: instrumentData } = await supabase
        .from('instrument_definitions')
        .select('ticker')
        .order('ticker', { ascending: true });

      if (instrumentData) {
        instrumentData.forEach(r => {
          const t = r.ticker;
          if (t) {
            tickers.push({ ticker: t });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching instrument_definitions:', error);
    }

    // 3. fixed_income_definitions
    try {
      const { data: fixedIncomeData } = await supabase
        .from('fixed_income_definitions')
        .select('ticker')
        .order('ticker', { ascending: true });

      if (fixedIncomeData) {
        fixedIncomeData.forEach(r => {
          const t = r.ticker;
          if (t) {
            tickers.push({ ticker: t });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching fixed_income_definitions:', error);
    }

    // Deduplicar por ticker (igual que charts_app.py)
    const unique: any = {};
    for (const item of tickers) {
      const t = item.ticker;
      if (t && !unique[t]) {
        unique[t] = { ticker: t };
      }
    }

    const result = Object.values(unique).sort((a: any, b: any) => 
      (a.ticker || '').toLowerCase().localeCompare((b.ticker || '').toLowerCase())
    );

    return NextResponse.json({
      success: true,
      total: result.length,
      series: result
    });
    
  } catch (error: any) {
    console.error('Error fetching chart series:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo series de gráficos'
    }, { status: 500 });
  }
}
