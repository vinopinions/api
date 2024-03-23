import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mimeTypes from 'mime-types';
import { StreamingBlobPayloadInputTypes } from '../../node_modules/@smithy/types/dist-types/streaming-payload/streaming-blob-payload-input-types';
import { BucketDirectory, IMAGE_EXTENSION } from './constants';

@Injectable()
export class S3Service {
  constructor(private configService: ConfigService) {}

  private config = {
    endpoint: this.configService.get<string>('S3_ENDPOINT'),
    accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
    secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_KEY'),
    region: this.configService.getOrThrow<string>('S3_REGION'),
    bucket: this.configService.getOrThrow('S3_BUCKET'),
  };

  private s3 = new S3Client({
    endpoint: this.config.endpoint,
    forcePathStyle: this.config.endpoint?.includes('minio'), // required by minio for development
    credentials: {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    },
    region: this.config.region,
  });

  async uploadImage(
    key: string,
    directory: BucketDirectory,
    body: StreamingBlobPayloadInputTypes,
  ): Promise<boolean> {
    return await this.upload(key + IMAGE_EXTENSION, directory, body);
  }

  async upload(
    key: string,
    directory: BucketDirectory,
    body: StreamingBlobPayloadInputTypes,
  ): Promise<boolean> {
    const mimeType: string | false = mimeTypes.lookup(key);
    if (!mimeType) {
      throw new Error(`Unknown MIME Type for key '${key}'`);
    }

    const putCommand = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: `${directory}/${key}`,
      Body: body,
      ContentType: mimeType,
    });

    const response = await this.s3.send(putCommand);
    return response.$metadata.httpStatusCode == HttpStatus.OK;
  }

  async getContent(key: string, directory: BucketDirectory) {
    const getCommand = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: `${directory}/${key}`,
    });

    const response = await this.s3.send(getCommand);
    const bodyStream = response.Body!;
    return await bodyStream.transformToString();
  }

  async getSignedImageUrl(key: string, directory: BucketDirectory) {
    return await this.getSignedUrl(key + IMAGE_EXTENSION, directory);
  }

  async getSignedUrl(key: string, directory: BucketDirectory) {
    const getCommand = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: `${directory}/${key}`,
    });

    return await getSignedUrl(this.s3, getCommand);
  }

  async deleteImage(key: string, directory: BucketDirectory) {
    return await this.delete(key + IMAGE_EXTENSION, directory);
  }

  async delete(key: string, directory: BucketDirectory) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: `${directory}/${key}`,
    });

    return await this.s3.send(deleteCommand);
  }

  async existsImage(key: string, directory: BucketDirectory) {
    return await this.exists(key + IMAGE_EXTENSION, directory);
  }

  async exists(key: string, directory: BucketDirectory) {
    try {
      const result = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: `${directory}/${key}`,
        }),
      );
      console.log(result);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
