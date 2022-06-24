import { UserClient, UserOption } from './user';

export class AdminClient extends UserClient {
  constructor(token: string, option: UserOption = {}) {
    super(token, option);
  }
}
