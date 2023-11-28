import { Test, TestingModule } from '@nestjs/testing';
import { WinemakersService } from './winemakers.service';

describe('WinemakersService', () => {
  let service: WinemakersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinemakersService],
    }).compile();

    service = module.get<WinemakersService>(WinemakersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
