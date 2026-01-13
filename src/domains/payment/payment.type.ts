export interface CreatePaymentOutPutBase<TDate> {
  id: string;
  price: number;
  createdAt: TDate;
}
