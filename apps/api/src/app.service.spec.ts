import { AppService } from './app.service';

describe('AppService', () => {
  it('returns an ok health payload', () => {
    const service = new AppService();

    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'api',
    });
  });
});
