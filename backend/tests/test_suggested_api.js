const axios = require('axios');

async function testCommentApi() {
  const post_no = '196058089';
  const url = `https://api.sooplive.com/comment/list?post_no=${post_no}&page=1`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Referer': `https://www.sooplive.com/station/chaenna02/post/${post_no}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Comment API Data:', JSON.stringify(response.data, null, 2).substring(0, 2000));
  } catch (error) {
    console.error('Error fetching API:', error.message);
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
  }
}

testCommentApi();