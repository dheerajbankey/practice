import { LoggerService } from '../providers';
import { AuthenticatedRequest, Context } from '../types';

export abstract class BaseController {
  protected readonly logger: LoggerService;

  constructor(options?: { loggerDefaultMeta?: any }) {
    this.logger = new LoggerService(options?.loggerDefaultMeta);
  }

  protected getContext(req: AuthenticatedRequest): Context {
    console.log('This is req of user', req.user);

    return {
      user: req.user,
    };
  }
}
