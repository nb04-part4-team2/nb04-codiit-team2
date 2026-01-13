import { jest } from '@jest/globals';

console.log('Test Setup');

// 테스트 중 console 출력 억제 (디버깅 시 주석 처리)
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // console 복원
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});
