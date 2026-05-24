const axios = require('axios');

async function testStApi() {
  const bj_id = 'chaenna02';
  const post_no = '196058089';
  const url = `https://st.sooplive.com/api/get_comment_list.php`;
  
  try {
    const response = await axios.get(url, {
      params: {
        szBjId: bj_id,
        nTitleNo: post_no,
        nPageNo: 1
      },
      headers: {
        'Referer': `https://www.sooplive.com/station/${bj_id}/post/${post_no}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('St Response:', JSON.stringify(response.data, null, 2).substring(0, 2000));
  } catch (error) {
    console.error('Error fetching API:', error.message);
  }
}

testStApi();