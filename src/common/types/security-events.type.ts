/**
 * 보안 및 비즈니스 이벤트 타입
 * 로깅 시 event 필드로 사용
 *
 * @example
 * logger.warn({
 *   event: SecurityEventType.FORBIDDEN_ACCESS,
 *   userId: 'user123',
 *   storeId: 'store456',
 * }, 'Forbidden access attempt');
 */
export enum SecurityEventType {
  /**
   * 인증 없이 보호된 리소스 접근 시도
   * 예: 로그인 없이 API 요청
   */
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',

  /**
   * 권한 부족으로 접근 거부
   * 예: 다른 사용자의 스토어 수정 시도
   */
  FORBIDDEN_ACCESS = 'FORBIDDEN_ACCESS',

  /**
   * 중복 리소스 생성 시도
   * 예: 이미 스토어가 있는데 추가 생성 시도, 중복 관심 등록
   */
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',

  /**
   * 존재하지 않는 리소스 접근
   * 예: 삭제된 스토어 조회 시도
   */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  /**
   * 비즈니스 규칙 위반
   * 예: 재고 부족 상태에서 주문 시도
   */
  INVALID_BUSINESS_LOGIC = 'INVALID_BUSINESS_LOGIC',

  /**
   * 느린 쿼리 감지 (1초 이상)
   * 성능 모니터링 및 최적화 대상
   */
  SLOW_QUERY = 'SLOW_QUERY',
}
