import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mimeTypes from 'mime-types';
import { StreamingBlobPayloadInputTypes } from '../../node_modules/@smithy/types/dist-types/streaming-payload/streaming-blob-payload-input-types';

@Injectable()
export class S3Service {
  constructor(private configService: ConfigService) {}

  config = {
    endpoint: this.configService.get<string>('S3_ENDPOINT'),
    accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
    secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_KEY'),
    region: this.configService.getOrThrow<string>('S3_REGION'),
    bucket: this.configService.getOrThrow('S3_BUCKET'),
  };

  s3 = new S3Client({
    endpoint: this.config.endpoint,
    forcePathStyle: this.config.endpoint?.includes('minio'), // required by minio for development
    credentials: {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    },
    region: this.config.region,
  });

  async upload(
    key: string,
    body: StreamingBlobPayloadInputTypes,
  ): Promise<boolean> {
    const mimeType: string | false = mimeTypes.lookup(key);
    if (!mimeType) {
      throw new Error(`Unknown MIME Type for key '${key}'`);
    }

    const putCommand = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
    });

    const response = await this.s3.send(putCommand);
    return response.$metadata.httpStatusCode == HttpStatus.OK;
  }

  async getContent(key: string) {
    const getCommand = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    const response = await this.s3.send(getCommand);
    const bodyStream = response.Body!;
    return await bodyStream.transformToString();
  }

  async getSignedUrl(key: string) {
    const getCommand = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3, getCommand);
  }

  async delete(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return await this.s3.send(deleteCommand);
  }
}
