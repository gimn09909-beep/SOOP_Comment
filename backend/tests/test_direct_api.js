const axios = require('axios');

async function testApi() {
  const bj_id = 'chaenna02';
  const post_id = '196058089';
  const url = `https://api-channel.sooplive.com/v1.1/channel/${bj_id}/post/${post_id}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Referer': `https://www.sooplive.com/station/${bj_id}/post/${post_id}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Post API Data:', JSON.stringify(response.data, null, 2).substring(0, 1000));
    
    // Try comments
    const commentUrl = `https://api-channel.sooplive.com/v1.1/channel/${bj_id}/post/${post_id}/comment`;
    const commentResponse = await axios.get(commentUrl, {
      params: {
        page: 1,
        per_page: 50
      },
      headers: {
        'Referer': `https://www.sooplive.com/station/${bj_id}/post/${post_id}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Comment API Data:', JSON.stringify(commentResponse.data, null, 2).substring(0, 2000));

  } catch (error) {
    console.error('Error fetching API:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
  }
}

testApi();