const axios = require('axios');

async function testApiWithHeaders() {
  const bj_id = 'chaenna02';
  const post_id = '196058089';
  const url = `https://api-channel.sooplive.com/v1.1/channel/${bj_id}/post/${post_id}/comment?page=1&per_page=50`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.sooplive.com',
        'Referer': `https://www.sooplive.com/station/${bj_id}/post/${post_id}`,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Success!', JSON.stringify(response.data, null, 2).substring(0, 1000));
  } catch (error) {
    console.log('Failed:', error.message);
    if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
    }
  }
}

testApiWithHeaders();