const axios = require('axios');

// Helper function to map common source names to NewsAPI source IDs
const mapToNewsAPISourceIds = (sources) => {
  const sourceMapping = {
    'cnn': 'cnn',
    'bbc': 'bbc-news',
    'reuters': 'reuters',
    'associated press': 'associated-press',
    'ap news': 'associated-press',
    'npr': 'npr',
    'fox news': 'fox-news',
    'abc news': 'abc-news',
    'nbc news': 'nbc-news',
    'cbs news': 'cbs-news',
    'usa today': 'usa-today',
    'wall street journal': 'the-wall-street-journal',
    'new york times': 'the-new-york-times',
    'washington post': 'the-washington-post',
    'bloomberg': 'bloomberg',
    'techcrunch': 'techcrunch',
    'ars technica': 'ars-technica',
    'the verge': 'the-verge',
    'wired': 'wired',
    'engadget': 'engadget'
  };
  
  return sources
    .map(source => sourceMapping[source.toLowerCase()] || source.toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
};

const getNewsFromNewsAPI = async (preferences) => {
  try {
    const { tags, newsSources, newsdepth, newsFormatPreference, newsFrequency, instructionTags } = preferences.news;
    
    console.log('User preferences:', { tags, newsSources, newsdepth, newsFormatPreference, instructionTags });
    
    const baseURL = 'https://newsapi.org/v2';
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEWS_API_KEY environment variable is not set');
    }

    // Try multiple strategies to get articles
    let articles = [];
    
    // Strategy 1: Try with user preferences
    if (tags && tags.length > 0) {
      console.log('Trying Strategy 1: User tags');
      articles = await tryNewsAPIRequest(baseURL, apiKey, {
        strategy: 'user-tags',
        query: tags.join(' OR '),
        sources: newsSources,
        useEverything: newsdepth === 'deep' || newsFormatPreference === 'analysis'
      });
    }
    
    // Strategy 2: Try top headlines without specific query
    if (articles.length === 0) {
      console.log('Trying Strategy 2: Top headlines');
      articles = await tryNewsAPIRequest(baseURL, apiKey, {
        strategy: 'top-headlines',
        sources: newsSources,
        useEverything: false
      });
    }
    
    // Strategy 3: Try general everything search
    if (articles.length === 0) {
      console.log('Trying Strategy 3: General search');
      articles = await tryNewsAPIRequest(baseURL, apiKey, {
        strategy: 'general',
        query: 'news',
        useEverything: true
      });
    }
    
    // Strategy 4: Last resort - popular domains
    if (articles.length === 0) {
      console.log('Trying Strategy 4: Popular domains');
      articles = await tryNewsAPIRequest(baseURL, apiKey, {
        strategy: 'domains',
        useEverything: true,
        domains: 'bbc.com,cnn.com,reuters.com'
      });
    }

    return articles;
    
  } catch (error) {
    console.error('Error fetching news from NewsAPI:', error.message);
    return [];
  }
};

// Helper function to try different NewsAPI requests
const tryNewsAPIRequest = async (baseURL, apiKey, options) => {
  try {
    const { strategy, query, sources, useEverything, domains } = options;
    
    const endpoint = useEverything ? 'everything' : 'top-headlines';
    
    const params = {
      apiKey: apiKey,
      language: 'en',
      pageSize: 50, // Increased to get more results
    };

    // Add parameters based on strategy
    if (endpoint === 'everything') {
      params.sortBy = 'publishedAt'; // Changed from relevancy to get fresher content
      
      if (strategy === 'domains') {
        params.domains = domains;
      } else if (query) {
        params.q = query;
      }
      
      if (sources && strategy !== 'domains') {
        params.sources = mapToNewsAPISourceIds(sources).join(',');
      }
      
      // Get articles from last 3 days instead of 1 day
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      params.from = threeDaysAgo.toISOString().split('T')[0];
      
    } else {
      // top-headlines
      if (query && strategy !== 'top-headlines') {
        params.q = query;
      }
      
      if (sources) {
        params.sources = mapToNewsAPISourceIds(sources).join(',');
      } else {
        params.country = 'us';
      }
    }
    
    console.log(`Trying ${strategy} with endpoint: ${endpoint}`);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(`${baseURL}/${endpoint}`, { params });
    
    console.log(`${strategy} - Status: ${response.status}, Total: ${response.data.totalResults}`);
    
    if (response.data.status !== 'ok') {
      throw new Error(`NewsAPI Error: ${response.data.message}`);
    }
    
    // Transform articles to match your expected format
    const articles = response.data.articles
      .filter(article => {
        // Filter out articles with null/empty essential fields
        return article.title && 
               article.url && 
               article.title !== '[Removed]' &&
               article.description &&
               article.description !== '[Removed]' &&
               !article.title.toLowerCase().includes('death') &&
               !article.title.toLowerCase().includes('died') &&
               !article.title.toLowerCase().includes('accident');
      })
      .map(article => ({
        title: article.title,
        url: article.url,
        description: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        content: article.content,
        author: article.author
      }));
    
    console.log(`${strategy} - Filtered Articles Count: ${articles.length}`);
    return articles;
    
  } catch (error) {
    console.error(`Error with ${options.strategy}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return [];
  }
};


// Alternative function for specific categories
const getNewsByCategory = async (category, preferences) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEWS_API_KEY environment variable is not set');
    }
    
    const params = {
      apiKey: apiKey,
      category: category, // business, entertainment, general, health, science, sports, technology
      country: 'us',
      language: 'en',
      pageSize: 20
    };
    
    const response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
    
    if (response.data.status !== 'ok') {
      throw new Error(`NewsAPI Error: ${response.data.message}`);
    }
    
    return response.data.articles
      .filter(article => {
        return article.title && 
               article.url && 
               article.title !== '[Removed]' &&
               article.description;
      })
      .map(article => ({
        title: article.title,
        url: article.url,
        description: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        content: article.content,
        author: article.author
      }));
    
  } catch (error) {
    console.error(`Error fetching ${category} news:`, error.message);
    return [];
  }
};
const shortlistRecentArticles = (articles, searchQuery, limit = 10) => {
  try {
    console.log(`Starting shortlist process with ${articles.length} articles`);
    
    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    console.log(`Filtering articles published after: ${twentyFourHoursAgo.toISOString()}`);
    
    // Step 1: Filter articles from last 24 hours
    const recentArticles = articles.filter(article => {
      if (!article.publishedAt) {
        console.log(`Article "${article.title}" has no publishedAt date, excluding`);
        return false;
      }
      
      const publishedDate = new Date(article.publishedAt);
      const isRecent = publishedDate >= twentyFourHoursAgo;
      
      if (!isRecent) {
        console.log(`Article "${article.title}" published ${publishedDate.toISOString()} is older than 24 hours, excluding`);
      }
      
      return isRecent;
    });
    
    console.log(`After 24-hour filter: ${recentArticles.length} articles remaining`);
    
    if (recentArticles.length === 0) {
      console.log('No articles found in last 24 hours, falling back to last 48 hours');
      
      // Fallback: Try last 48 hours if no articles in 24 hours
      const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
      const fallbackArticles = articles.filter(article => {
        if (!article.publishedAt) return false;
        const publishedDate = new Date(article.publishedAt);
        return publishedDate >= fortyEightHoursAgo;
      });
      
      console.log(`After 48-hour fallback filter: ${fallbackArticles.length} articles`);
      
      if (fallbackArticles.length === 0) {
        console.log('No articles found in last 48 hours, returning all articles');
        return articles.slice(0, limit);
      }
      
      return scoreAndRankArticles(fallbackArticles, searchQuery, limit);
    }
    
    // Step 2: Score and rank the recent articles
    return scoreAndRankArticles(recentArticles, searchQuery, limit);
    
  } catch (error) {
    console.error('Error in shortlistTopArticles:', error.message);
    // Fallback: return first 'limit' articles if something goes wrong
    return articles.slice(0, limit);
  }
};

const scoreAndRankArticles = (articles, searchQuery, limit) => {
  try {
    // Convert search query to lowercase for matching
    const queryTerms = searchQuery ? searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2) : [];
    
    console.log(`Scoring articles with query terms: [${queryTerms.join(', ')}]`);
    
    // Score each article based on relevance
    const scoredArticles = articles.map(article => {
      let score = 0;
      const title = article.title.toLowerCase();
      const description = (article.description || '').toLowerCase();
      const content = (article.content || '').toLowerCase();
      
      // Score based on query term matches
      queryTerms.forEach(term => {
        // Title matches (highest weight)
        if (title.includes(term)) {
          score += 10;
        }
        
        // Description matches (medium weight)
        if (description.includes(term)) {
          score += 5;
        }
        
        // Content matches (lower weight)
        if (content.includes(term)) {
          score += 2;
        }
      });
      
      // Bonus points for recent publication (within last 6 hours)
      const publishedDate = new Date(article.publishedAt);
      const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000));
      if (publishedDate >= sixHoursAgo) {
        score += 5;
      }
      
      // Bonus points for having good metadata
      if (article.author && article.author.trim() !== '') {
        score += 1;
      }
      
      if (article.urlToImage) {
        score += 1;
      }
      
      if (article.description && article.description.length > 100) {
        score += 1;
      }
      
      // Penalty for duplicate or low-quality indicators
      if (title.includes('[removed]') || description.includes('[removed]')) {
        score -= 10;
      }
      
      if (title.length < 20) {
        score -= 2;
      }
      
      return {
        ...article,
        relevanceScore: score
      };
    });
    
    // Sort by score (descending) then by publication date (newest first)
    const rankedArticles = scoredArticles
      .sort((a, b) => {
        // Primary sort: by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Secondary sort: by publication date (newest first)
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      })
      .slice(0, limit);
    
    console.log('Top articles with scores:');
    rankedArticles.forEach((article, index) => {
      console.log(`${index + 1}. Score: ${article.relevanceScore} - "${article.title}" (${new Date(article.publishedAt).toLocaleString()})`);
    });
    
    // Remove the score property before returning
    return rankedArticles.map(({ relevanceScore, ...article }) => article);
    
  } catch (error) {
    console.error('Error in scoreAndRankArticles:', error.message);
    return articles.slice(0, limit);
  }
};

// Alternative function for strict 24-hour filtering only
const filterLast24Hours = (articles) => {
  const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
  
  return articles.filter(article => {
    if (!article.publishedAt) return false;
    const publishedDate = new Date(article.publishedAt);
    return publishedDate >= twentyFourHoursAgo;
  });
};

// Helper function to get articles from different time ranges
const getArticlesByTimeRange = (articles, hours = 24) => {
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return articles
    .filter(article => {
      if (!article.publishedAt) return false;
      const publishedDate = new Date(article.publishedAt);
      return publishedDate >= cutoffTime;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};



// Option 1: Using TinyURL (No API key required)
async function shortenUrlTinyURL(longUrl) {
    try {
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        return response.data;
    } catch (error) {
        throw new Error(`TinyURL Error: ${error.message}`);
    }
}

// Option 2: Using is.gd (No API key required)
async function shortenUrlIsGd(longUrl) {
    try {
        const response = await axios.post('https://is.gd/create.php', null, {
            params: {
                format: 'simple',
                url: longUrl
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`is.gd Error: ${error.message}`);
    }
}

// Option 3: Using Bitly (Requires free API token)
async function shortenUrlBitly(longUrl, accessToken) {
    try {
        const response = await axios.post('https://api-ssl.bitly.com/v4/shorten', {
            long_url: longUrl
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.link;
    } catch (error) {
        throw new Error(`Bitly Error: ${error.response?.data?.message || error.message}`);
    }
}

// Option 4: Using Short.link (Requires free API key)
async function shortenUrlShortLink(longUrl, apiKey) {
    try {
        const response = await axios.post('https://short.link/api/links', {
            originalURL: longUrl
        }, {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        });
        return response.data.shortURL;
    } catch (error) {
        throw new Error(`Short.link Error: ${error.response?.data?.message || error.message}`);
    }
}

// Main function that tries multiple services
async function shortenUrl(longUrl) {
    // const { service = 'tinyurl', apiKey, accessToken } = options;
    const service = 'tinyurl'; // Default to TinyURL
    
    // Validate URL format
    try {
        new URL(longUrl);
    } catch {
        throw new Error('Invalid URL format');
    }
    
    switch (service.toLowerCase()) {
        case 'tinyurl':
            return await shortenUrlTinyURL(longUrl);
        case 'isgd':
            return await shortenUrlIsGd(longUrl);
        // case 'bitly':
        //     if (!accessToken) throw new Error('Bitly requires an access token');
        //     return await shortenUrlBitly(longUrl, accessToken);
        // case 'shortlink':
        //     if (!apiKey) throw new Error('Short.link requires an API key');
        //     return await shortenUrlShortLink(longUrl, apiKey);
        default:
            throw new Error('Unsupported service. Use: tinyurl, isgd, bitly, or shortlink');
    }
}

// Usage examples
async function examples() {
    try {
        // Using TinyURL (free, no API key needed)
        const shortUrl1 = await shortenUrl('https://www.google.com');
        console.log('TinyURL:', shortUrl1);
        
        // Using is.gd (free, no API key needed)
        const shortUrl2 = await shortenUrl('https://www.google.com', { service: 'isgd' });
        console.log('is.gd:', shortUrl2);
        
        // Using Bitly (requires free account and token)
        // const shortUrl3 = await shortenUrl('https://www.google.com', { 
        //     service: 'bitly', 
        //     accessToken: 'YOUR_BITLY_ACCESS_TOKEN' 
        // });
        // console.log('Bitly:', shortUrl3);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}



module.exports = {
  getNewsFromNewsAPI,
  getNewsByCategory,
  shortlistRecentArticles,
  filterLast24Hours,
  shortenUrl,
  getArticlesByTimeRange
};