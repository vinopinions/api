import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';
import { FindManyOptions, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { PageDto } from '../pagination/page.dto';
import { S3Service } from '../s3/s3.service';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import { PaginationOptionsDto } from './../pagination/pagination-options.dto';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService extends CommonService<Store> {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    @Inject(forwardRef(() => WinesService)) private winesService: WinesService,
    private s3Service: S3Service,
  ) {
    super(storeRepository, Store, async (store: Store) => {
      if (await s3Service.existsImage(store.id, 'store'))
        store.image = await this.s3Service.getSignedImageUrl(store.id, 'store');
      return store;
    });
  }

  async create(name: string, address?: string, url?: string): Promise<Store> {
    const store: Store = this.storeRepository.create({ name, address, url });
    const dbStore = await this.storeRepository.save(store);
    return this.findOne({ where: { id: dbStore.id } });
  }

  async findWinesPaginated(
    store: Store,
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Wine>,
  ): Promise<PageDto<Wine>> {
    return await this.winesService.findManyByStorePaginated(
      store,
      paginationOptionsDto,
      options,
    );
  }

  async findManyByWinePaginated(
    wine: Wine,
    paginationOptionsDto: PaginationOptionsDto,
    options?: FindManyOptions<Store>,
  ): Promise<PageDto<Store>> {
    return await this.findManyPaginated(paginationOptionsDto, {
      relations: ['wines'],
      ...options,
      where: { ...options?.where, ...{ wines: { id: wine.id } } },
    });
  }

  async delete(store: Store): Promise<Store> {
    await this.deleteImage(store);
    await this.storeRepository.remove(store);
    return store;
  }

  async deleteImage(store: Store) {
    await this.s3Service.deleteImage(store.id, 'store');
  }

  async updateImage(store: Store, file: Express.Multer.File) {
    const buffer: Buffer = await sharp(file.buffer)
      .resize(200, 200)
      .jpeg({ mozjpeg: true })
      .toBuffer();

    await this.s3Service.uploadImage(store.id, 'store', buffer);
  }
}
