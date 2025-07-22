const SerpApi = require("google-search-results-nodejs");
require('dotenv').config();
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);

exports.getSportsNewsFromSerpApi = (subcategory) => {
  //const query = [subcategory, ...tags].join(" ");

  const params = {
    engine: "google_news",
   // topic:"cricket",
    q:subcategory,
    //so:0,
    //q: "cricket, india, test, t20, one day",
    hl: "en",
   // tbm:"nws",
    gl: "in",
    //tbs:"news",
    safe: "active",
    num:100
  };

  return new Promise((resolve, reject) => {
    search.json(params, (data) => {
      if (!data || !data.news_results) {
        return reject("No news found");
      }

      const formatted = data.news_results.map(item => ({
        title: item.title,
        url: item.link,
        source: item.source,
        date: item.date,
        snippet: item.snippet
      }));

      resolve(formatted);
    });
  });
};

