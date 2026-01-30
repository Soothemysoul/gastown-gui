function parseJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export class GitHubGateway {
  constructor({ runner }) {
    if (!runner?.exec) throw new Error('GitHubGateway requires a runner with exec()');
    this._runner = runner;
  }

  async exec(args, options = {}) {
    return this._runner.exec('gh', args, { timeoutMs: 15000, ...options });
  }

  async getDefaultBranch({ owner, repo } = {}) {
    const result = await this.exec(['api', `repos/${owner}/${repo}`, '--jq', '.default_branch'], {
      timeoutMs: 10000,
    });
    const branch = (result.stdout || '').trim();
    return { ...result, branch: branch || null };
  }

  async listPullRequests({ repo, state = 'open', limit = 20, fields } = {}) {
    const jsonFields = fields || [
      'number',
      'title',
      'author',
      'createdAt',
      'updatedAt',
      'url',
      'headRefName',
      'state',
      'isDraft',
      'reviewDecision',
    ];

    const result = await this.exec([
      'pr',
      'list',
      '--repo',
      repo,
      '--state',
      state,
      '--json',
      jsonFields.join(','),
      '--limit',
      String(limit),
    ], { timeoutMs: 10000 });

    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async viewPullRequest({ repo, number, fields } = {}) {
    const jsonFields = fields || [
      'number',
      'title',
      'author',
      'body',
      'createdAt',
      'updatedAt',
      'url',
      'headRefName',
      'baseRefName',
      'state',
      'isDraft',
      'additions',
      'deletions',
      'commits',
      'files',
      'reviews',
      'comments',
    ];

    const result = await this.exec([
      'pr',
      'view',
      String(number),
      '--repo',
      repo,
      '--json',
      jsonFields.join(','),
    ], { timeoutMs: 15000 });

    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async listIssues({ repo, state = 'open', limit = 30, fields } = {}) {
    const jsonFields = fields || [
      'number',
      'title',
      'author',
      'labels',
      'createdAt',
      'updatedAt',
      'url',
      'state',
    ];

    const result = await this.exec([
      'issue',
      'list',
      '--repo',
      repo,
      '--state',
      state,
      '--json',
      jsonFields.join(','),
      '--limit',
      String(limit),
    ], { timeoutMs: 10000 });

    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async viewIssue({ repo, number, fields } = {}) {
    const jsonFields = fields || [
      'number',
      'title',
      'author',
      'body',
      'createdAt',
      'updatedAt',
      'url',
      'state',
      'labels',
      'comments',
      'assignees',
    ];

    const result = await this.exec([
      'issue',
      'view',
      String(number),
      '--repo',
      repo,
      '--json',
      jsonFields.join(','),
    ], { timeoutMs: 15000 });

    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async listRepos({ limit = 100, visibility } = {}) {
    const args = [
      'repo',
      'list',
      '--limit',
      String(limit),
      '--json',
      'name,nameWithOwner,description,url,isPrivate,isFork,pushedAt,primaryLanguage,stargazerCount',
    ];
    if (visibility && visibility !== 'all') {
      args.push('--visibility', visibility);
    }

    const result = await this.exec(args, { timeoutMs: 30000 });
    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }
}

