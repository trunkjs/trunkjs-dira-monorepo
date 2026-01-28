import { DiraController, DiraHttp } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

@DiraController('/files')
export class FilesController {
  // Example: GET /files/path/to/file.txt → filePath = "path/to/file.txt"
  @DiraHttp('/::filePath')
  getFileByPath(req: DiraRequest) {
    const { filePath } = req.params;
    return { filePath };
  }
}
