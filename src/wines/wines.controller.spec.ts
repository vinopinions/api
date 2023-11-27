import { Test, TestingModule } from '@nestjs/testing';
import { WinesController } from './wines.controller';

describe('WinesController', () => {
  let controller: WinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WinesController],
    }).compile();

    controller = module.get<WinesController>(WinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
