import swaggerJsdoc, { type Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Codiit API Documentation',
      version: '1.0.0',
      description: '코디잇(CODI-IT) 이커머스 플랫폼 백엔드 API 명세서입니다.',
      contact: {
        name: 'CODI-IT Team 2',
        url: 'https://github.com/nb04-part4-team2/nb04-codiit-team2',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.stayme.kr',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    tags: [
      { name: 'Auth', description: '인증 (회원가입, 로그인, 토큰 갱신)' },
      { name: 'User', description: '사용자 (프로필, 주소, 등급)' },
      { name: 'Store', description: '스토어 관리 (등록, 수정, 조회, 찜하기)' },
      { name: 'Product', description: '상품 관리 (등록, 수정, 조회, 카테고리)' },
      { name: 'Cart', description: '장바구니 (추가, 수정, 삭제, 조회)' },
      { name: 'Order', description: '주문 (생성, 조회, 취소, 배송 상태)' },
      { name: 'Review', description: '리뷰 (작성, 수정, 삭제, 조회)' },
      { name: 'Inquiry', description: '문의 (질문, 답변, 비밀글)' },
      { name: 'Notification', description: '알림 (실시간 SSE, 읽음 처리)' },
      { name: 'Dashboard', description: '대시보드 (판매 통계, 매출 분석)' },
      { name: 'Metadata', description: '메타데이터 (등급 정책)' },
      { name: 'S3', description: '파일 업로드 (이미지)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '로그인 후 발급받은 Access Token을 입력하세요.',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/documentation/swagger/**/*.yaml', // 개발: tsx watch Hot-reload
    './dist/documentation/swagger/**/*.yaml', // 프로덕션: Docker build
  ],
};

export const specs = swaggerJsdoc(options);
