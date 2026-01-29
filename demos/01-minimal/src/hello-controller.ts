import { DiraController, DiraHttp } from '@dira/core';

@DiraController('/api')
export class HelloController {
  @DiraHttp('/hello')
  hello(): { message: string } {
    return { message: 'Hello, Dira!' };
  }
}
