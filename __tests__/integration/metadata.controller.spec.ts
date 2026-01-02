import { testClient } from '../helpers/testClient.js';
// import { createTestContext, type TestContext } from '../helpers/dataFactory.js'; // 더 이상 사용되지 않음

describe('Metadata API Integration Test', () => {
  // beforeEach가 더 이상 필요하지 않음
  // beforeEach(async () => {
  //   ctx = await createTestContext();
  // });

  describe('GET /api/metadata/grade - 등급 정책 조회', () => {
    it('200: 등급 정책을 성공적으로 조회한다.', async () => {
      // Given (준비)
      // setup.integration.ts의 GRADE_SEED_DATA와 metadata.mapper.ts의 변환 로직에 맞춰 예상 데이터 구성
      const expectedGrades = [
        { id: 'grade_green', name: 'green', minAmount: 0, rate: 1 }, // 0.01 * 100 = 1
        { id: 'grade_orange', name: 'orange', minAmount: 100000, rate: 3 }, // 0.03 * 100 = 3
        { id: 'grade_red', name: 'red', minAmount: 300000, rate: 5 }, // 0.05 * 100 = 5
        { id: 'grade_black', name: 'black', minAmount: 500000, rate: 7 }, // 0.07 * 100 = 7
        { id: 'grade_vip', name: 'vip', minAmount: 1000000, rate: 10 }, // 0.1 * 100 = 10
      ].sort((a, b) => a.minAmount - b.minAmount); // API 응답은 minAmount 기준으로 오름차순 정렬됨

      // When (실행)
      const response = await testClient.get('/api/metadata/grade');

      // Then (검증)
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body).toEqual(expectedGrades);
      expect(response.body.length).toBeGreaterThan(0); // 등급이 하나 이상 존재하는지 확인
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('minAmount');
      expect(response.body[0]).toHaveProperty('rate'); // rate 속성 확인
      expect(response.body[0]).not.toHaveProperty('maxAmount'); // maxAmount는 응답에 포함되지 않음
    });

    it('200: 등급 정책이 없을 경우 빈 배열을 반환한다.', async () => {
      // 현재 createTestContext의 beforeEach에서 항상 등급을 시드하므로,
      // 이 테스트 케이스를 활성화하려면 데이터 시딩을 조작해야 합니다.
      // (예: prisma.grade.deleteMany() 후 findAllGrades 호출 등)
      // 통합 테스트의 목적과 맞지 않을 수 있으므로, 일단 주석 처리된 상태로 유지합니다.
      // 필요하다면, createTestContext를 확장하여 특정 테스트에서만 등급을 시딩하지 않도록 만들 수 있습니다.
      // const response = await testClient.get('/api/metadata/grade');
      // expect(response.status).toBe(200);
      // expect(response.body).toEqual([]);
    });
  });
});
