import { logger } from '@/config/logger.js';
import { isAxiosError } from 'axios';

/**
 * Axios 에러를 처리하고 로깅하는 유틸리티 함수.
 * 웹훅 수신 API와 같이 별도의 클라이언트 응답이 필요 없는 경우에 사용.
 *
 * @param error - 처리할 에러 객체 (unknown 타입)
 * @param contextMessage - 에러 발생 상황을 설명하는 추가 메시지
 */
export const handleAxiosError = (error: unknown, contextMessage?: string) => {
  const baseMessage = contextMessage || 'Axios request failed';

  if (isAxiosError(error)) {
    logger.error(
      {
        err: {
          message: error.message,
          name: error.name,
          code: error.code,
        },
        request: {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers ? JSON.stringify(error.config.headers) : undefined,
          data: error.config?.data,
        },
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers ? JSON.stringify(error.response.headers) : undefined,
              data: error.response.data,
            }
          : 'No response received',
      },
      `${baseMessage} - Axios Error`,
    );
  } else {
    logger.error({ err: error }, `${baseMessage} - Non-Axios Error`);
  }
};
