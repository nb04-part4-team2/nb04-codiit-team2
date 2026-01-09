/**
 * 로깅 관련 유틸리티 함수
 */

/**
 * 민감정보 마스킹 - 전화번호
 * @param phoneNumber - 전화번호 (예: 010-1234-5678)
 * @returns 마스킹된 전화번호 (예: 010-****-5678)
 * @example
 * sanitizePhoneNumber('010-1234-5678') // '010-****-5678'
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  // 010-1234-5678 → 010-****-5678
  return phoneNumber.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
}

/**
 * 민감정보 마스킹 - 주소
 * @param address - 주소 (예: 서울시 강남구 테헤란로 123, 456호)
 * @returns 마스킹된 주소 (예: 서울시 강남구 테헤란로 123, ***)
 * @example
 * sanitizeAddress('서울시 강남구 테헤란로 123, 456호') // '서울시 강남구 테헤란로 123, ***'
 */
export function sanitizeAddress(address: string): string {
  if (!address) return '';
  // 쉼표 이전까지만 유지, 나머지는 ***
  const parts = address.split(',');
  return parts[0] + ', ***';
}

/**
 * unknown 에러를 Error 객체로 변환
 * @param error - unknown 타입 에러
 * @returns Error 객체
 * @example
 * try { ... } catch (error) { const err = sanitizeError(error); }
 */
export function sanitizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Unknown error occurred');
}

/**
 * 성능 측정용 유틸리티
 * @param startTime - Date.now()로 기록한 시작 시간
 * @returns 경과 시간 (밀리초)
 * @example
 * const start = Date.now();
 * await someOperation();
 * const duration = measureDuration(start);
 * logger.info({ durationMs: duration }, 'Operation completed');
 */
export function measureDuration(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * 로그용 에러 객체 정리
 * @param error - 원본 에러
 * @returns 로깅에 적합한 객체 (name, message, stack)
 * @example
 * const errorLog = formatErrorForLog(new Error('Test'));
 * logger.error({ error: errorLog }, 'Error occurred');
 */
export function formatErrorForLog(error: Error): object {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}
