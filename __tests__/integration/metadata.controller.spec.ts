import { testClient } from '../helpers/testClient.js';

describe('Metadata API Integration Test', () => {
  describe('GET /api/metadata/grade - 등급 정책 조회', () => {
    it('200: 등급 정책을 성공적으로 조회한다.', async () => {
      const expectedGrades = [
        { id: 'grade_green', name: 'green', minAmount: 0, rate: 1 },
        { id: 'grade_orange', name: 'orange', minAmount: 100000, rate: 3 },
        { id: 'grade_red', name: 'red', minAmount: 300000, rate: 5 },
        { id: 'grade_black', name: 'black', minAmount: 500000, rate: 7 },
        { id: 'grade_vip', name: 'vip', minAmount: 1000000, rate: 10 },
      ].sort((a, b) => a.minAmount - b.minAmount);

      const response = await testClient.get('/api/metadata/grade');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expectedGrades);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('minAmount');
      expect(response.body[0]).toHaveProperty('rate');
      expect(response.body[0]).not.toHaveProperty('maxAmount');
    });

    it('200: 등급 정책이 없을 경우 빈 배열을 반환한다.', async () => {});
  });
});
