import { BadRequestException, Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { extname } from 'path';

@Injectable()
export class CvTextExtractorService {
  async extract(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('A file is required');
    }

    const fileType = this.detectFileType(file);
    const text = await this.extractText(file.buffer, fileType);

    return {
      fileType,
      text: text.replace(/\s+/g, ' ').trim(),
    };
  }

  detectFileType(file: Pick<Express.Multer.File, 'originalname' | 'mimetype'>) {
    const extension = extname(file.originalname).toLowerCase();

    if (extension === '.pdf' || file.mimetype === 'application/pdf') {
      return FileType.PDF;
    }

    const docxMime =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extension === '.docx' || file.mimetype === docxMime) {
      return FileType.DOCX;
    }

    throw new BadRequestException('Only PDF and DOCX files are supported');
  }

  private async extractText(buffer: Buffer, fileType: FileType) {
    try {
      if (fileType === FileType.PDF) {
        const parsed = await pdfParse(buffer);
        return parsed.text ?? '';
      }

      const parsed = await mammoth.extractRawText({
        buffer,
      });

      return parsed.value ?? '';
    } catch {
      throw new BadRequestException('Unable to extract text from this CV file');
    }
  }
}
