import { DiraController, DiraHttp, type DiraRequest } from '@dira/core';

@DiraController('/files')
export class FilesController {
  @DiraHttp('/::path', { method: 'GET' })
  getFile(req: DiraRequest<unknown, unknown, { path: string }>): {
    path: string;
    found: boolean;
  } {
    return { path: req.params.path, found: true };
  }
}
