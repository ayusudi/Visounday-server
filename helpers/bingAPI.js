const axios = require('axios');

const { BING_SUBSCRIPTIONKEY } = process.env

async function searchImages(keywords) {
  const headers = { 'Ocp-Apim-Subscription-Key': BING_SUBSCRIPTIONKEY };
  let imageUrls = [];
  if (Array.isArray(keywords) && keywords.length > 0) {
    for (const keyword of keywords) {
      const params = new URLSearchParams({
        q: keyword,
        imageType: 'Clipart',
        count: '3',  // Number of images to return
        license: 'Public',  // Only images with public license
        safeSearch: 'Strict'  // Safe search filter
      });

      try {
        const response = await axios.get(`https://api.bing.microsoft.com/v7.0/images/search?${params}`, { headers });

        const urls = response.data.value.map(img => img.contentUrl);
        let object = { keyword, urls }
        imageUrls.push(object)
      } catch (error) {
        console.error(`Error fetching images for keyword: ${keyword}`, error.message);
      }
    }
  }
  return imageUrls;
}

// List of keywords

// Get list of image URLs

module.exports = searchImages