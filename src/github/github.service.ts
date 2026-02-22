import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly appId: string;
  private readonly privateKey: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('github.appId') ?? '';
    this.privateKey = this.configService.get<string>('github.privateKey') ?? '';
  }

  private async getInstallationOctokit(installationId: number): Promise<Octokit> {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId,
      },
    });
  }

  async getPullRequestFiles(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ) {
    const octokit = await this.getInstallationOctokit(installationId);
    
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return files;
  }

  async getFileContent(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<string | null> {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf8');
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Could not fetch file content for ${path}: ${errorMessage}`,
      );
      return null;
    }
  }

  async createReviewComment(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
  ) {
    const octokit = await this.getInstallationOctokit(installationId);

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });

    this.logger.log(`Posted review comment on PR #${pullNumber}`);
  }

  async createPRReview(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES' = 'COMMENT',
  ) {
    const octokit = await this.getInstallationOctokit(installationId);

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      body,
      event,
    });

    this.logger.log(`Created PR review on PR #${pullNumber}`);
  }
}
