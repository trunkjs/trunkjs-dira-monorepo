import { DiraController, DiraHttp } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

@DiraController('/files')
export class FilesController {
  // Mixed: regular param + wildcard param (more specific, must come first)
  // Example: GET /files/repos/my-org/my-repo/src/lib/utils.ts
  // → owner = "my-org", repo = "my-repo", path = "src/lib/utils.ts"
  @DiraHttp('/repos/:owner/:repo/::path')
  getRepoFile(req: DiraRequest) {
    const { owner, repo, path } = req.params;
    return { owner, repo, path };
  }

  // Catch-all wildcard (must come last)
  // Example: GET /files/path/to/file.txt → filePath = "path/to/file.txt"
  @DiraHttp('/::filePath')
  getFileByPath(req: DiraRequest) {
    const { filePath } = req.params;
    return { filePath };
  }
}
