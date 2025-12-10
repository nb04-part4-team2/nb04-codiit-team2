// 장바구니 베이스
export interface CartBase<TDate> {
  id: string;
  buyerId: string;
  quantity: number;
  createdAt: TDate;
  updatedAt: TDate;
}

interface StoreBase<TDate> {
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
  discountRate: number;
  discountStartTime: TTime | null;
  discountEndTime: TTime | null;
  store: TStore;
  stocks: TStocks[];
}

interface CartItemBase<TProduct, TDate> {
  id: string;
  cartId: string;
  productId: string;
  sizeId: number;
  quantity: number;
  product: TProduct;
  createdAt: TDate;
  updatedAt: TDate;
}

interface SizeRawData {
  id: number;
  en: string;
  ko: string;
}

interface SizeResponse {
  id: number;
  size: {
    en: string;
    ko: string;
  };
}

// DB 조회 결과 RawData
export type StockRawData = StockBase<SizeRawData>;
export interface StoreRawData extends StoreBase<Date> {
  detailAddress: string | null;
}
export type ProductRawData = ProductBase<StockRawData, StoreRawData, Date>;
export type CartItemRawData = CartItemBase<ProductRawData, Date>;

// response 응답용 data
export type StockResponse = StockBase<SizeResponse>;
export type StoreResponse = StoreBase<string>;
export type ProductResponse = ProductBase<StockResponse, StoreResponse, string>;
export type CartItemResponse = CartItemBase<ProductResponse, string>;
