import requests
import yfinance as yf
import json
import pandas as pd
import pandas_datareader.data as pdr

# ... existing code ...

def get_us_stock_symbols():
    """
    Fetches list of US stock symbols from NASDAQ, NYSE, and AMEX
    Returns a DataFrame with basic stock information and saves it to a CSV file
    """
    # Get NASDAQ symbols
    nasdaq = pd.read_csv('https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt', sep='|')
    nasdaq = nasdaq[nasdaq['Test Issue'] == 'N']  # Filter out test issues
    nasdaq = nasdaq[['Symbol', 'Security Name', 'Market Category', 'ETF']]
    
    # Clean up the data - handle NaN values
    nasdaq = nasdaq.dropna(subset=['Symbol'])  # Remove rows with NaN symbols
    nasdaq = nasdaq[nasdaq['Symbol'].astype(str).str.contains('^[A-Z]+$')]  # Only keep simple uppercase symbols
    
    # Create final DataFrame
    stocks_df = pd.DataFrame({
        'Symbol': nasdaq['Symbol'],
        'Name': nasdaq['Security Name'],
        'Exchange': 'NASDAQ',
        'ETF': nasdaq['ETF'] == 'Y'
    })
    
    # Get basic info for each stock
    def get_stock_details(symbol):
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            return {
                'Industry': info.get('industry'),
                'Sector': info.get('sector'),
                'Market_Cap': info.get('marketCap'),
                'Country': info.get('country')
            }
        except:
            return {'Industry': None, 'Sector': None, 'Market_Cap': None, 'Country': None}
    
    # Process in batches to avoid rate limiting
    batch_size = 100
    for i in range(0, len(stocks_df), batch_size):
        batch = stocks_df['Symbol'][i:i+batch_size]
        details = [get_stock_details(symbol) for symbol in batch]
        for j, detail in enumerate(details):
            stocks_df.loc[i+j, ['Industry', 'Sector', 'Market_Cap', 'Country']] = detail.values()
        print(f"Processed {i+batch_size} symbols...")
    
    # Save to CSV with date suffix
    file_path = f'us_stocks_metadata_{pd.Timestamp.now().strftime("%Y%m%d")}.csv'
    stocks_df.to_csv(file_path, index=False)
    return file_path

# Add to main if you want to run it
if __name__ == "__main__":

    file_path = get_us_stock_symbols()
    print(file_path)