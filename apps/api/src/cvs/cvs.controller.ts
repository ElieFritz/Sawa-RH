import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuditAction, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvsService } from './cvs.service';

@ApiTags('CVs')
@ApiBearerAuth()
@Controller('cvs')
export class CvsController {
  constructor(
    private readonly cvsService: CvsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @UseGuards(ProfileCompleteGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'categoryId', 'file'],
    },
  })
  @ApiOkResponse()
  async uploadCv(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCvDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('A CV file is required');
    }

    const cv = await this.cvsService.uploadCv(user, dto, file);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.UPLOAD_CV,
        targetType: 'CV',
        targetId: cv.id,
        metadata: {
          title: cv.title,
          fileType: cv.fileType,
        },
      },
      request,
    );

    return cv;
  }

  @Get('me')
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @ApiOkResponse()
  getMyCvs(@CurrentUser() user: AuthenticatedUser) {
    return this.cvsService.getMyCvs(user.id);
  }

  @Patch(':id')
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @ApiOkResponse()
  updateCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) cvId: string,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvsService.updateMyCv(user.id, cvId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @ApiOkResponse()
  async deleteCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) cvId: string,
    @Req() request: Request,
  ) {
    const cv = await this.cvsService.deleteMyCv(user.id, cvId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.DELETE_CV,
        targetType: 'CV',
        targetId: cvId,
        metadata: {
          title: cv.title,
        },
      },
      request,
    );

    return cv;
  }

  @Get(':id/view-url')
  @ApiOkResponse()
  async getViewUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) cvId: string,
    @Req() request: Request,
  ) {
    const result = await this.cvsService.getSignedViewUrl(user, cvId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.VIEW_CV,
        targetType: 'CV',
        targetId: cvId,
      },
      request,
    );

    return result;
  }

  @Get(':id/download-url')
  @ApiOkResponse()
  async getDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) cvId: string,
    @Req() request: Request,
  ) {
    const result = await this.cvsService.getSignedDownloadUrl(user, cvId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.DOWNLOAD_CV,
        targetType: 'CV',
        targetId: cvId,
      },
      request,
    );

    return result;
  }
}
