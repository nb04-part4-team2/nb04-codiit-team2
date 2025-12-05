import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { prismaErrorHandler } from '@/common/middlewares/errorHandlers/prismaErrorHandler.js';
import { zodErrorHandler } from '@/common/middlewares/errorHandlers/zodErrorHandler.js';
import { catchAllErrorHandler } from '@/common/middlewares/errorHandlers/catchAllErrorHandler.js';
import { businessErrorHandler } from '@/common/middlewares/errorHandlers/businessErrorHandler.js';
import { env } from '@/config/constants.js';

// 라우터 import
// import authRouter from '@/domains/auth/auth.router.js';
import userRouter from '@/domains/user/user.router.js';
// import storeRouter from '@/domains/store/store.router.js';
import productRouter from '@/domains/product/product.router.js';
// import cartRouter from '@/domains/cart/cart.router.js';
// import orderRouter from '@/domains/order/order.router.js';
import { inquiryRouter } from '@/domains/inquiry/inquiry.router.js';
// import reviewRouter from '@/domains/review/review.router.js';
// import notificationRouter from '@/domains/notification/notification.router.js';
// import dashboardRouter from '@/domains/dashboard/dashboard.router.js';
// import metadataRouter from '@/domains/metadata/metadata.router.js';

const app = express();

// 보안 미들웨어
app.use(helmet());

// HTTP 요청 로깅
// 개발: 상세 로그 (dev), 운영: 간결 로그 (combined)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 기본 미들웨어
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우터 등록
// app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
// app.use('/api/stores', storeRouter);
app.use('/api/products', productRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/orders', orderRouter);
app.use('/api/inquiries', inquiryRouter);
// app.use('/api/reviews', reviewRouter);
// app.use('/api/notifications', notificationRouter);
// app.use('/api/dashboard', dashboardRouter);
// app.use('/api/metadata', metadataRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// 글로벌 에러 핸들러 (항상 마지막에 등록)
app.use(prismaErrorHandler);
app.use(zodErrorHandler);
app.use(businessErrorHandler);
app.use(catchAllErrorHandler);

export { app };
