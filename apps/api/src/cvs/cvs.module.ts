import { Module } from '@nestjs/common';

import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { CvTextExtractorService } from './cv-text-extractor.service';

@Module({
  controllers: [CvsController],
  providers: [CvsService, CvTextExtractorService, ProfileCompleteGuard],
})
export class CvsModule {}
