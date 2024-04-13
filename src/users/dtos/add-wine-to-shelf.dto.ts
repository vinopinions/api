import { PickType } from '@nestjs/swagger';
import { Wine } from '../../wines/entities/wine.entity';

export class AddWineToShelfDto extends PickType(Wine, ['id'] as const) {}
