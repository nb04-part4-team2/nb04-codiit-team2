import {
  GetCartResponse,
  GetCartRawData,
  CreateCartRawData,
  CreateCartResponse,
  UpdateCartRawData,
  UpdateCartResponse,
  GetCartItemDetailRawData,
  GetCartItemDetailResponse,
} from '@/domains/cart/cart.dto.js';
import {
  CartBase,
  CartItemBase,
  GetCartItemRawData,
  GetCartItemResponse,
  ProductRawData,
  ProductResponse,
  StockRawData,
  StockResponse,
  StoreRawData,
  StoreResponse,
} from '@/domains/cart/cart.type.js';
import { toStoreResponse as getStoreResponse } from '@/domains/store/store.mapper.js';

// ============================================
// 응답 객체 베이스들
// ============================================
const toCartBaseResponse = (cart: CartBase<Date>): CartBase<string> => ({
  id: cart.id,
  buyerId: cart.buyerId,
  createdAt: cart.createdAt.toISOString(),
  updatedAt: cart.updatedAt.toISOString(),
});

const toCartItemBaseResponse = (item: CartItemBase<Date>): CartItemBase<string> => ({
  id: item.id,
  cartId: item.cartId,
  productId: item.productId,
  sizeId: item.sizeId,
  quantity: item.quantity,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

// ============================================
// 응답 객체 조립용 부품들
// ============================================
const toStockResponse = (stock: StockRawData): StockResponse => ({
  id: stock.id,
  productId: stock.productId,
  sizeId: stock.sizeId,
  quantity: stock.quantity,
  size: {
    id: stock.size.id,
    name: stock.size.en,
    size: {
      en: stock.size.en,
      ko: stock.size.ko,
    },
  },
});

// 반환 형태가 유사한 store.mapper.ts의 toStoreResponse 재사용
const toStoreResponse = (storeRawData: StoreRawData): StoreResponse => {
  const { detailAddress: _detailAddress, ...store } = getStoreResponse(storeRawData);
  return store;
};

export const toProductResponse = (productRawData: ProductRawData): ProductResponse => {
  const now = new Date();
  const isDiscountActive =
    productRawData.discountRate > 0 &&
    (!productRawData.discountStartTime || now >= productRawData.discountStartTime) &&
    (!productRawData.discountEndTime || now <= productRawData.discountEndTime);

  const discountPrice = isDiscountActive
    ? Math.floor(productRawData.price * (1 - productRawData.discountRate / 100))
    : productRawData.price;

  return {
    id: productRawData.id,
    storeId: productRawData.storeId,
    name: productRawData.name,
    price: productRawData.price,
    image: productRawData.image,
    discountPrice,
    discountRate: productRawData.discountRate,
    discountStartTime: productRawData.discountStartTime?.toISOString() ?? null,
    discountEndTime: productRawData.discountEndTime?.toISOString() ?? null,
    createdAt: productRawData.createdAt.toISOString(),
    updatedAt: productRawData.updatedAt.toISOString(),
    reviewsRating: productRawData.reviewsRating,
    categoryId: productRawData.categoryId,
    store: toStoreResponse(productRawData.store),
    stocks: productRawData.stocks.map(toStockResponse),
  };
};

const toItemResponse = (itemRawData: GetCartItemRawData): GetCartItemResponse => ({
  ...toCartItemBaseResponse(itemRawData),
  product: toProductResponse(itemRawData.product),
});

// ============================================
// 장바구니 조회 응답 객체 변환
// ============================================
export const toGetCartResponse = (rawCart: GetCartRawData): GetCartResponse => ({
  ...toCartBaseResponse(rawCart),
  items: rawCart.items.map(toItemResponse),
});
// 실제 반환
// {
//   "id": "cmimnz6au0001jv043njbfsd1",
//   "buyerId": "cmimny4n20000jp048jbtbf1f",
//   "quantity": 0 -------------------------------------- swagger에만 있음
//   "createdAt": "2025-12-01T04:43:40.327Z",
//   "updatedAt": "2025-12-01T04:43:40.327Z",
//   "items": [
//       {
//           "id": "cmj250deb0001jo04ybuuoz5y",
//           "cartId": "cmimnz6au0001jv043njbfsd1",
//           "productId": "cmc1i97y10055iup6srpu0ht9",
//           "sizeId": 1,
//           "quantity": 1,
//           "createdAt": "2025-12-12T00:37:02.291Z",
//           "updatedAt": "2025-12-12T00:37:02.291Z",
//           "product": {
//               "id": "cmc1i97y10055iup6srpu0ht9",
//               "storeId": "cmc1i97wi002jiup6s0eo86zo",
//               "name": "러블리 블라우스",
//               "price": 31400,
//               "image": "https://sprint-be-project.s3.ap-northeast-2.amazonaws.com/codiit/1749632940896-러블리 블라우스.jpg",
//               "discountRate": 5,
//               "discountStartTime": "2025-06-18T05:22:06.878Z",
//               "discountEndTime": "2025-06-23T05:22:06.878Z",
//               "createdAt": "2025-05-24T05:22:07.596Z",
//               "updatedAt": "2025-06-18T05:22:10.840Z",
//               "reviewsRating": 4, --------------------------------- swagger에 없음
//               "categoryId": "cmc1i97sc0000iup6w2i0rkz2", ---------- swagger에 없음
//               "content": "여성스럽고 우아한 러블리 블라우스입니다. ..." - swagger에 없음, 상품 상세 정보(장바구니에서 쓰이는 곳 없음 필요x)
//               "isSoldOut": true, ---------------------------------- swagger에 없음, 프론트에서 붙이는 필드 (백엔드에서 넘길 필요x)
//               "store": {
//                   "id": "cmc1i97wi002jiup6s0eo86zo",
//                   "userId": "cmc1i97v5000viup6x3k862vz",
//                   "name": "유니클로",
//                   "address": "서울특별시 중구 명동길 45",
//                   "phoneNumber": "02-2323-2424",
//                   "content": "베이직 라이프웨어 브랜드",
//                   "image": "uniqlo.jpg",
//                   "createdAt": "2025-06-18T05:22:07.554Z",
//                   "updatedAt": "2025-06-18T05:22:07.554Z",
//                   "detailAddress": null --------------------------- swagger에 없음, 장바구니에서 사용안함 (필요 x)
//               },
//               "stocks": [
//                   {
//                       "id": "cmc1i980f00gliup6wqozd8zy",
//                       "productId": "cmc1i97y10055iup6srpu0ht9",
//                       "sizeId": 1,
//                       "quantity": 26,
//                       "size": {
//                           "id": 1,
//                           "name": "XS", -------------------------- swagger에 없음
//                           "size": {
//                               "en": "XS",
//                               "ko": "XS"
//                           }
//                       }
//                   },
//                   {
//                       "id": "cmc1i980f00gniup6poof05ti",
//                       "productId": "cmc1i97y10055iup6srpu0ht9",
//                       "sizeId": 2,
//                       "quantity": 3,
//                       "size": {
//                           "id": 2,
//                           "name": "S",
//                           "size": {
//                               "en": "Small",
//                               "ko": "S"
//                           }
//                       }
//                   },
//                   {
//                       "id": "cmc1i980f00gpiup6hlicedk3",
//                       "productId": "cmc1i97y10055iup6srpu0ht9",
//                       "sizeId": 3,
//                       "quantity": 5,
//                       "size": {
//                           "id": 3,
//                           "name": "M",
//                           "size": {
//                               "en": "Medium",
//                               "ko": "M"
//                           }
//                       }
//                   }
//               ]
//           }
//       }
// ============================================
// 장바구니 생성 응답 객체 변환
// ============================================
export const toCreateCartResponse = (rawCart: CreateCartRawData): CreateCartResponse => {
  return toCartBaseResponse(rawCart);
};
// 실제 반환 - swagger랑 불일치
// 단, 프론트에서 create 한 장바구니 데이터를 활용하지 않고 타입또한 지정해놓지 않아서 문제 x
// 조회 객체에서도 없어서 삭제함
// {
//   "id": "cmimnz6au0001jv043njbfsd1",
//   "buyerId": "cmimny4n20000jp048jbtbf1f",
//   "quantity": 1 -> swagger 문서에만 있는 부분
//   "createdAt": "2025-12-01T04:43:40.327Z",
//   "updatedAt": "2025-12-01T04:43:40.327Z"
// }
// ============================================
// 장바구니 수정 응답 객체 변환
// ============================================
export const toUpdateCartResponse = (rawItems: UpdateCartRawData[]): UpdateCartResponse[] => {
  return rawItems.map(toCartItemBaseResponse);
};
// 실제 반환 객체 예시 - swagger랑 일치함
// {
//   "productId":"cmca1imcl002dntmkxb2240dp",
//   "sizes": [
//     {"sizeId":2,"quantity":2}
//   ]
// }
// ============================================
// 아이템 상세 조회 응답 객체 변환
// ============================================
// 프론트에서 호출하는 부분 없음
export const toGetCartItemResponse = (
  rawItem: GetCartItemDetailRawData,
): GetCartItemDetailResponse => ({
  ...toItemResponse(rawItem), // 명시적으로 필드를 1대1 매치하기때문에 cart가 같이 들어가도 안전
  cart: toCartBaseResponse(rawItem.cart),
});
