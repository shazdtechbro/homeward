import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import type { PhotoStorage } from "@/core/ports";

/** A private bucket: photos are only ever served through /api/photos, never by public URL. */
export class S3PhotoStorage implements PhotoStorage {
  private readonly s3: S3Client;

  constructor(
    config: S3ClientConfig,
    private readonly bucket: string,
  ) {
    this.s3 = new S3Client(config);
  }

  async put(key: string, bytes: Uint8Array, contentType: string) {
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: contentType }),
    );
  }

  async get(key: string) {
    try {
      const object = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!object.Body) return undefined;
      return {
        bytes: await object.Body.transformToByteArray(),
        contentType: object.ContentType ?? "image/jpeg",
      };
    } catch (error) {
      if ((error as Error).name === "NoSuchKey") return undefined;
      throw error;
    }
  }
}
