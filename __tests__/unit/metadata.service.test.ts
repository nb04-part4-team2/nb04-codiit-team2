import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MetadataService } from '../../src/domains/metadata/metadata.service.js';
import { MetadataRepository } from '../../src/domains/metadata/metadata.repository.js';
import { createGradeMock } from '../mocks/metadata.mock.js';

describe('MetadataService', () => {
  let mockMetadataRepo: DeepMockProxy<MetadataRepository>;
  let metadataService: MetadataService;

  beforeEach(() => {
    jest.resetAllMocks();
    mockMetadataRepo = mockDeep<MetadataRepository>();

    metadataService = new MetadataService(mockMetadataRepo);
  });

  describe('getGradePolicy', () => {
    it('등급 정책을 성공적으로 반환한다.', async () => {
      const mockGrades = createGradeMock();

      mockMetadataRepo.findAllGrades.mockResolvedValue(mockGrades);

      const result = await metadataService.getGradePolicy();

      expect(result).toEqual(mockGrades);
      expect(mockMetadataRepo.findAllGrades).toHaveBeenCalledTimes(1);
    });

    it('등급 정책이 없을 경우 빈 배열을 반환한다.', async () => {
      mockMetadataRepo.findAllGrades.mockResolvedValue([]);

      const result = await metadataService.getGradePolicy();

      expect(result).toEqual([]);
      expect(mockMetadataRepo.findAllGrades).toHaveBeenCalledTimes(1);
    });
  });
});
