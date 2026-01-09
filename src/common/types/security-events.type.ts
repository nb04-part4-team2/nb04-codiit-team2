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

  /**
   * 로그인 성공
   * 예: 사용자가 올바른 이메일/비밀번호로 로그인
   */
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',

  /**
   * 로그인 실패
   * 예: 존재하지 않는 이메일, 잘못된 비밀번호
   */
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',

  /**
   * 토큰 갱신 성공
   * 예: Refresh Token을 사용한 Access Token 갱신
   */
  TOKEN_REFRESH_SUCCESS = 'TOKEN_REFRESH_SUCCESS',

  /**
   * 유효하지 않은 토큰
   * 예: 존재하지 않거나 이미 무효화된 토큰
   */
  TOKEN_INVALID = 'TOKEN_INVALID',

  /**
   * 만료된 토큰
   * 예: 유효 기간이 지난 Refresh Token
   */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  /**
   * 로그아웃 성공
   * 예: 사용자가 명시적으로 로그아웃
   */
  LOGOUT_SUCCESS = 'LOGOUT_SUCCESS',

  /**
   * 사용자 회원가입 성공
   * 예: 새로운 사용자가 가입 완료
   */
  USER_CREATED = 'USER_CREATED',

  /**
   * 사용자 프로필 수정 성공
   * 예: 이름, 이미지 변경
   */
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',

  /**
   * 사용자 비밀번호 변경
   * 예: 비밀번호 변경 완료 (보안 이벤트)
   */
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',

  /**
   * 사용자 회원 탈퇴
   * 예: 계정 삭제 완료 (중요 이벤트)
   */
  USER_DELETED = 'USER_DELETED',

  /**
   * 사용자 등급 업그레이드
   * 예: 누적 구매액 증가로 VIP 등급 상향
   */
  USER_GRADE_UPGRADED = 'USER_GRADE_UPGRADED',

  /**
   * 사용자 등급 다운그레이드
   * 예: 시간 경과로 등급 하향 (미래 기능)
   */
  USER_GRADE_DOWNGRADED = 'USER_GRADE_DOWNGRADED',
}
