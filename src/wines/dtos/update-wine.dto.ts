import { PickType } from '@nestjs/swagger';
import { CreateWineDto } from './create-wine.dto';

export class UpdateWineDto extends PickType(CreateWineDto, [
  'storeIds',
] as const) {}
