import { DiraController, DiraHttp, type DiraHttpRequest } from '@dira/core';

@DiraController('/files')
export class FilesController {
  @DiraHttp('/::path', { method: 'GET' })
  getFile(req: DiraHttpRequest<unknown, unknown, { path: string }>): {
    path: string;
    found: boolean;
  } {
    return { path: req.params.path, found: true };
  }
}
