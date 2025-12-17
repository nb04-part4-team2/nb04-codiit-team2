export class MetadataService {
  async getGrades() {
    const grades = [
      {
        id: 'grade_green',
        name: 'Green',
        rate: 1,
        minAmount: 0,
      },
      {
        id: 'grade_orange',
        name: 'Orange',
        rate: 3,
        minAmount: 100000,
      },
      {
        id: 'grade_red',
        name: 'Red',
        rate: 5,
        minAmount: 300000,
      },
      {
        id: 'grade_black',
        name: 'Black',
        rate: 7,
        minAmount: 500000,
      },
      {
        id: 'grade_vip',
        name: 'VIP',
        rate: 10,
        minAmount: 1000000,
      },
    ];
    return grades;
  }
}
