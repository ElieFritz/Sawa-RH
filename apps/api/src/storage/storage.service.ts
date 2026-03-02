import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  async uploadPrivateCv(file: {
    buffer: Buffer;
    originalName: string;
    contentType: string;
  }) {
    const client = this.getClient();
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'cvs');
    const extension = extname(file.originalName).toLowerCase();
    const sanitizedBaseName = file.originalName
      .replace(extension, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);
    const fileName = `${randomUUID()}-${sanitizedBaseName || 'cv'}${extension}`;
    const filePath = `${new Date().toISOString().slice(0, 10)}/${fileName}`;

    const { error } = await client.storage.from(bucket).upload(filePath, file.buffer, {
      contentType: file.contentType,
      upsert: false,
    });

    if (error) {
      throw new InternalServerErrorException('CV upload failed');
    }

    return {
      filePath,
    };
  }

  async createSignedUrl(filePath: string, options?: { download?: string; expiresIn?: number }) {
    const client = this.getClient();
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'cvs');
    const { data, error } = await client.storage.from(bucket).createSignedUrl(filePath, options?.expiresIn ?? 900, {
      download: options?.download,
    });

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException('Unable to create signed URL');
    }

    return data.signedUrl;
  }

  async removePrivateCv(filePath: string) {
    const client = this.getClient();
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'cvs');
    const { error } = await client.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new InternalServerErrorException('Unable to delete CV from storage');
    }
  }

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new ServiceUnavailableException('Supabase storage is not configured');
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return this.client;
  }
}
