// Date 타입변환 함수 (배열용)
export const toExpectedList = (
  items: (object & { createdAt?: Date; updatedAt?: Date })[],
): Record<string, unknown>[] => {
  return items.map((item) => {
    const newItem: Record<string, unknown> = { ...item };
    if (item.createdAt) {
      newItem.createdAt = item.createdAt.toISOString();
    }
    if (item.updatedAt) {
      newItem.updatedAt = item.updatedAt.toISOString();
    }
    return newItem;
  });
};

// Date 타입변환 함수
export const toExpectedWithIsoDate = <T extends { createdAt: Date; updatedAt: Date }>(
  record: T,
) => ({
  ...record,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
