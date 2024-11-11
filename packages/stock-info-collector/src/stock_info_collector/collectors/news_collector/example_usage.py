from serp_news_collector import SerpNewsCollector

def main():
    # Initialize collector
    collector = SerpNewsCollector()
    
    # Collect news for Apple stock
    news = collector.collect("AAPL", days_back=7)
    
    # Print results
    for article in news:
        print(f"Title: {article['title']}")
        print(f"Source: {article['source']}")
        print(f"Date: {article['date']}")
        print(f"Link: {article['link']}")
        print("---")

if __name__ == "__main__":
    main() 