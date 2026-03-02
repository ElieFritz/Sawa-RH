import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MeService } from './me.service';

@ApiTags('Me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @ApiOkResponse()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.getMe(user.id);
  }

  @Patch('profile')
  @ApiOkResponse()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.meService.updateProfile(user, dto);
  }

  @Post('profile/submit')
  @ApiOkResponse()
  submitProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.meService.submitProfile(user);
  }
}
