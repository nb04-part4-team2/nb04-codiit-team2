import { CreateOrderServiceInput, ProductInfoRawData } from '@/domains/order/order.dto.js';
import { CreateOrderItemInputWithPrice } from '@/domains/order/order.type.js';
import { BadRequestError, NotFoundError } from '@/common/utils/errors.js';

export function buildOrderData(
  products: ProductInfoRawData[],
  orderItems: CreateOrderServiceInput['orderItems'],
) {
  return orderItems.reduce(
    (acc, item) => {
      // 상품 존재 여부 체크 (방어코드)
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundError('상품 없음');
      }
      // 재고 수량 검증 (방어코드)
      const stock = product.stocks.find((stock) => stock.sizeId === item.sizeId);
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestError(`'${product.name}' 상품의 재고가 부족합니다.`);
      }
      acc.subtotal += product.price * item.quantity; // 상품 총액
      acc.totalQuantity += item.quantity; // 총 주문 수량
      acc.matchedOrderItems.push({
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: product.price,
      }); // 주문 아이템에 price 추가해서 조립
      return acc;
    },
    { subtotal: 0, totalQuantity: 0, matchedOrderItems: [] as CreateOrderItemInputWithPrice[] },
  );
}
