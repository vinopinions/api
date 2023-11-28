import { Test, TestingModule } from '@nestjs/testing';
import { WinemakersController } from './winemakers.controller';

describe('WinemakersController', () => {
  let controller: WinemakersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WinemakersController],
    }).compile();

    controller = module.get<WinemakersController>(WinemakersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
