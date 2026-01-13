import { CreateOrderServiceInput, ProductInfoRawData } from '@/domains/order/order.dto.js';
import { CreateOrderItemInputWithPrice, PaymentRawData } from '@/domains/order/order.type.js';
import { BadRequestError, NotFoundError } from '@/common/utils/errors.js';

export function buildOrderData(
  products: ProductInfoRawData[],
  orderItems: CreateOrderServiceInput['orderItems'],
) {
  const now = new Date();
  return orderItems.reduce(
    (acc, item) => {
      // 상품 존재 여부 체크 (방어코드)
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundError('상품 없음');
      }

      let realPrice = product.price; // 기본은 원가

      const isDiscountActive =
        product.discountRate > 0 &&
        // 할인 로직 카트 부분이랑 통일
        // 시작일이 없거나(null) 지났으면 할인 적용
        (!product.discountStartTime || now >= product.discountStartTime) &&
        // 종료일이 없거나(null) 아직 안 지났어도 적용
        (!product.discountEndTime || now <= product.discountEndTime);

      if (isDiscountActive) {
        realPrice = Math.floor(product.price * (1 - product.discountRate / 100));
      }

      // 재고 수량 검증 (방어코드)
      const stock = product.stocks.find((stock) => stock.sizeId === item.sizeId);
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestError(`'${product.name}' 상품의 재고가 부족합니다.`);
      }
      // 원가(product.price) 대신 할인가(realPrice) 사용
      acc.subtotal += realPrice * item.quantity;
      acc.totalQuantity += item.quantity; // 총 주문 수량
      acc.matchedOrderItems.push({
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: realPrice, // 원가가 아니라 할인된 가격 적용
        // 주문 아이템은 단순한 상품이 아니라 주문된 아이템을 의미하기 때문에 주문 당시의 가격이 저장되는게 맞는 것 같음
        // 주문 아이템은 주문 한 상태 그대로 저장되어야함
      }); // 주문 아이템에 price 추가해서 조립
      return acc;
    },
    { subtotal: 0, totalQuantity: 0, matchedOrderItems: [] as CreateOrderItemInputWithPrice[] },
  );
}

export function buildPaymentStatus(payments: PaymentRawData[]) {
  if (payments.some((p) => p.status === 'completed')) {
    return 'completed';
  }

  if (payments.some((p) => p.status === 'pending')) {
    return 'pending';
  }

  if (payments.some((p) => p.status === 'cancelled')) {
    return 'cancelled'; // 추후 결제 취소(주문 취소) 구현시 사용
  }

  return 'failed';
}
