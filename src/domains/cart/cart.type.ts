// 장바구니 베이스
export interface CartBase<TDate> {
  id: string;
  buyerId: string;
  createdAt: TDate;
  updatedAt: TDate;
}
// 장바구니 아이템 베이스
export interface CartItemBase<TDate> {
  id: string;
  cartId: string;
  productId: string;
  sizeId: number;
  quantity: number;
  createdAt: TDate;
  updatedAt: TDate;
}

export interface StoreBase<TDate> {
  id: string;
  userId: string;
  name: string;
  address: string;
  phoneNumber: string;
  content: string;
  image: string | null;
  createdAt: TDate;
  updatedAt: TDate;
}

interface StockBase<TSize> {
  id: string;
  productId: string;
  sizeId: number;
  quantity: number;
  size: TSize;
}

interface ProductBase<TStocks, TStore, TTime> {
  id: string;
  storeId: string;
  name: string;
  price: number;
  image: string;
  discountPrice?: number;
  discountRate: number;
  discountStartTime: TTime | null;
  discountEndTime: TTime | null;
  createdAt: TTime;
  updatedAt: TTime;
  reviewsRating: number;
  categoryId: string;
  store: TStore;
  stocks: TStocks[];
}
// 자식이 제네릭을 받아 부모에게 넘겨줄 수 있음
interface GetCartItemBase<TProduct, TDate> extends CartItemBase<TDate> {
  product: TProduct;
}

export interface SizeRawData {
  id: number;
  en: string;
  ko: string;
}

export interface SizeResponse {
  id: number;
  name: string;
  size: {
    en: string;
    ko: string;
  };
}

// DB 조회 결과 RawData type
export type StockRawData = StockBase<SizeRawData>;
export interface StoreRawData extends StoreBase<Date> {
  detailAddress: string | null;
}
export type ProductRawData = ProductBase<StockRawData, StoreRawData, Date>;
export type GetCartItemRawData = GetCartItemBase<ProductRawData, Date>;

// response 응답용 data type
export type StockResponse = StockBase<SizeResponse>;
export type StoreResponse = StoreBase<string>;
export type ProductResponse = ProductBase<StockResponse, StoreResponse, string>;
export type GetCartItemResponse = GetCartItemBase<ProductResponse, string>;
