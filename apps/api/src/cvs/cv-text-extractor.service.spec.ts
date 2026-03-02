import { BadRequestException } from '@nestjs/common';

import { CvTextExtractorService } from './cv-text-extractor.service';

describe('CvTextExtractorService', () => {
  const service = new CvTextExtractorService();

  it('detects PDF and DOCX files', () => {
    expect(
      service.detectFileType({
        originalname: 'resume.pdf',
        mimetype: 'application/pdf',
      }),
    ).toBe('PDF');

    expect(
      service.detectFileType({
        originalname: 'resume.docx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    ).toBe('DOCX');
  });

  it('rejects unsupported file types', () => {
    expect(() =>
      service.detectFileType({
        originalname: 'resume.txt',
        mimetype: 'text/plain',
      }),
    ).toThrow(BadRequestException);
  });
});
