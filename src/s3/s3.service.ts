import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';

@Injectable()
export class S3Service {
  constructor(private configService: ConfigService) {}

  s3 = new S3Client({
    endpoint: this.configService.get('S3_ENDPOINT'),
    forcePathStyle: this.configService
      .get<string>('S3_ENDPOINT')
      ?.includes('minio'), // required for minio
    credentials: {
      accessKeyId: this.configService.getOrThrow('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.getOrThrow('S3_SECRET_KEY'),
    },
    region: this.configService.get('S3_REGION'),
  });

  async test() {
    const command = new PutObjectCommand({
      Bucket: this.configService.getOrThrow('S3_BUCKET'),
      Key: 'README.md',
      Body: fs.readFileSync('/workspace/README.md'),
    });
    console.log(await this.s3.send(command));
  }
}
