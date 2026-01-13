import { testClient, authRequest } from '../helpers/testClient.js';
import { generateBuyerToken } from '../helpers/authHelper.js';
import { createTestContext, TEST_PASSWORD, type TestContext } from '../helpers/dataFactory.js';

describe('Auth API Integration Test', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  // ===== POST /api/auth/login - 로그인 =====
  describe('POST /api/auth/login', () => {
    it('201: 로그인 성공', async () => {
      const loginData = {
        email: ctx.buyer.email,
        password: TEST_PASSWORD,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);
      console.log('Login response:', response.status, JSON.stringify(response.body));
      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(ctx.buyer.id);
      expect(response.body.user.email).toBe(ctx.buyer.email);
      expect(response.body.user.name).toBe(ctx.buyer.name);
      expect(response.body.user.type).toBe('BUYER');
      expect(response.body.user.grade).toBeDefined();

      // refreshToken 쿠키 설정 확인
      const rawCookies = response.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);
    });

    it('201: 판매자 로그인 성공', async () => {
      const loginData = {
        email: ctx.seller.email,
        password: TEST_PASSWORD,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(201);
      expect(response.body.user.type).toBe('SELLER');
    });

    it('401: 존재하지 않는 이메일', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: TEST_PASSWORD,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(401);
    });

    it('401: 비밀번호 불일치', async () => {
      const loginData = {
        email: ctx.buyer.email,
        password: 'wrongpassword',
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(401);
    });

    it('400: 이메일 누락', async () => {
      const loginData = {
        password: TEST_PASSWORD,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(400);
    });

    it('400: 비밀번호 누락', async () => {
      const loginData = {
        email: ctx.buyer.email,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(400);
    });

    it('400: 유효하지 않은 이메일 형식', async () => {
      const loginData = {
        email: 'invalid-email',
        password: TEST_PASSWORD,
      };

      const response = await testClient.post('/api/auth/login').send(loginData);

      expect(response.status).toBe(400);
    });
  });

  // ===== POST /api/auth/refresh - 토큰 갱신 =====
  describe('POST /api/auth/refresh', () => {
    it('200: 토큰 갱신 성공', async () => {
      // 먼저 로그인하여 refreshToken 쿠키 획득
      const loginResponse = await testClient.post('/api/auth/login').send({
        email: ctx.buyer.email,
        password: TEST_PASSWORD,
      });

      const cookies = loginResponse.headers['set-cookie'];

      // refresh 요청
      const response = await testClient.post('/api/auth/refresh').set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('401: refreshToken 쿠키 없음', async () => {
      const response = await testClient.post('/api/auth/refresh');

      expect(response.status).toBe(401);
    });

    it('401: 유효하지 않은 refreshToken', async () => {
      const response = await testClient
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token');
      expect(response.status).toBe(401);
    });
  });

  // ===== POST /api/auth/logout - 로그아웃 =====
  describe('POST /api/auth/logout', () => {
    it('200: 로그아웃 성공', async () => {
      const buyerToken = generateBuyerToken(ctx.buyer.id);

      const response = await authRequest(buyerToken).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('로그아웃 되었습니다.');

      // refreshToken 쿠키 클리어 확인
      const rawCookies = response.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const refreshTokenCookie = cookies.find((cookie) => cookie.startsWith('refreshToken='));
      if (refreshTokenCookie) {
        // 쿠키가 클리어되면 값이 비어있거나 만료됨
        expect(
          refreshTokenCookie.includes('refreshToken=;') ||
            refreshTokenCookie.includes('Expires=Thu, 01 Jan 1970'),
        ).toBe(true);
      }
    });

    it('401: 인증 없이 로그아웃 요청', async () => {
      const response = await testClient.post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});
