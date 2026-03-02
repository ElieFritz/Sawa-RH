import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'api',
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
