import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Logger,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhooks } from '@octokit/webhooks';
import { Request } from 'express';
import { ReviewService } from '../review/review.service.js';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

interface PullRequestPayload {
  action: string;
  installation: { id: number };
  repository: { owner: { login: string }; name: string };
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    head: { sha: string };
  };
}

@Controller('webhook')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);
  private readonly webhooks: Webhooks;

  constructor(
    private configService: ConfigService,
    private reviewService: ReviewService,
  ) {
    this.webhooks = new Webhooks({
      secret: this.configService.get<string>('github.webhookSecret') ?? '',
    });
  }

  @Post('github')
  @HttpCode(200)
  async handleGitHubWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    this.logger.log(
      `Received webhook - Event: ${event}, Signature present: ${!!signature}`,
    );

    const payload = req.rawBody?.toString() || JSON.stringify(req.body);

    if (!payload || payload === '{}') {
      this.logger.error('Empty payload received');
      throw new HttpException('Empty payload', HttpStatus.BAD_REQUEST);
    }

    // Verify webhook signature
    try {
      const isValid = await this.webhooks.verify(payload, signature);
      this.logger.log(`Signature verification result: ${isValid}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Invalid webhook signature: ${errorMessage}`);
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    this.logger.log(`Received GitHub event: ${event}`);

    let body: PullRequestPayload;
    try {
      body = JSON.parse(payload) as PullRequestPayload;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to parse payload: ${errorMessage}`);
      throw new HttpException('Invalid JSON payload', HttpStatus.BAD_REQUEST);
    }

    // Handle pull request events
    if (event === 'pull_request') {
      const action = body.action;
      this.logger.log(`PR action: ${action}`);

      if (action === 'opened' || action === 'synchronize') {
        this.logger.log(
          `Processing PR #${body.pull_request.number}: ${body.pull_request.title}`,
        );

        // Process review asynchronously - don't await
        this.reviewService
          .reviewPullRequest(
            body.installation.id,
            body.repository.owner.login,
            body.repository.name,
            body.pull_request.number,
            body.pull_request.title,
            body.pull_request.body || '',
            body.pull_request.head.sha,
          )
          .catch((error: Error) => {
            this.logger.error(
              `Error reviewing PR: ${error.message}`,
              error.stack,
            );
          });

        return { status: 'processing', pr: body.pull_request.number };
      }
    }

    return { status: 'ok', event };
  }
}
