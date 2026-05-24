const request = require('supertest');
const app = require('../index');

describe('Backend API & Logic Tests', () => {
  describe('B02: Pagination & Data Fetching', () => {
    test('should return 400 if URL is missing', async () => {
      const response = await request(app).get('/api/comments');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });

    test('should return 400 for invalid SOOP URL', async () => {
      const response = await request(app).get('/api/comments?url=https://google.com');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('올바른 SOOP 주소가 아닙니다.');
    });
  });

  describe('P02: Cache Logic', () => {
    test('Cache should store and return data', () => {
      // Internal logic test could be added here by exporting the cache object if needed
    });
  });
});
