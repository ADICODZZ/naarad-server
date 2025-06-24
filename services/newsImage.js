const axios = require('axios');

async function fetchImageForArticle(title) {
  const params = {
     engine: 'google_images',
    q: `${title} `,
    hl: 'en',
    gl: 'in',
    location: 'India',
    imgsz: 'large',
    image_type: 'photo',
    safe: 'active',
    licenses: 'fc',
    period_unit: 'd',
    period_value: 7,
    api_key: process.env.SERPAPI_API_KEY
  };

  try {
    const response = await axios.get('https://serpapi.com/search', { params });
    console.log(response.data,"response.data");
    const imageResults = response.data.images_results;
    console.log(imageResults,"imageResults");

    if (imageResults && imageResults.length > 0) {
      return imageResults[0].original || imageResults[0].thumbnail;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching image from SerpAPI:', error.message);
    return null;
  }
}

// const puppeteer = require('puppeteer');

async function getImageFromPage(url) {
  try {
    const { data } = await axios.get(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    console.log(data,"data");
    return data?.data?.image?.url || null;
  } catch (err) {
    console.error("Microlink failed:", err.message);
    return null;
  };
}


module.exports={fetchImageForArticle,getImageFromPage}
