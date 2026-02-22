import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from '../github/github.service';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  // File extensions to review
  private readonly REVIEWABLE_EXTENSIONS = [
    '.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs',
    '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.swift', '.kt',
    '.scala', '.vue', '.svelte', '.html', '.css', '.scss', '.sql',
  ];

  constructor(
    private githubService: GitHubService,
    private openaiService: OpenAIService,
  ) {}

  async reviewPullRequest(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    title: string,
    description: string,
    headSha: string,
  ): Promise<void> {
    this.logger.log(`Starting review for PR #${pullNumber} in ${owner}/${repo}`);

    try {
      // Get all changed files in the PR
      const files = await this.githubService.getPullRequestFiles(
        installationId,
        owner,
        repo,
        pullNumber,
      );

      // Filter to only reviewable files
      const reviewableFiles = files.filter((file) =>
        this.REVIEWABLE_EXTENSIONS.some((ext) => file.filename.endsWith(ext)),
      );

      if (reviewableFiles.length === 0) {
        this.logger.log('No reviewable files found in PR');
        return;
      }

      this.logger.log(`Found ${reviewableFiles.length} reviewable files`);

      // Generate PR summary
      const fileNames = reviewableFiles.map((f) => f.filename);
      const summary = await this.openaiService.summarizePR(
        title,
        description,
        fileNames,
      );

      // Review each file
      const fileReviews: string[] = [];

      for (const file of reviewableFiles) {
        if (!file.patch) {
          continue; // Skip files without patches (e.g., binary files)
        }

        // Optionally get full file content for context
        let fileContent: string | null = null;
        if (file.status !== 'removed' && file.changes < 500) {
          fileContent = await this.githubService.getFileContent(
            installationId,
            owner,
            repo,
            file.filename,
            headSha,
          );
        }

        const review = await this.openaiService.reviewCode(
          file.filename,
          file.patch,
          fileContent ?? undefined,
        );

        fileReviews.push(`### 📄 \`${file.filename}\`\n\n${review}`);
      }

      // Compose the final review comment
      const reviewBody = this.composeReviewComment(summary, fileReviews);

      // Post the review
      await this.githubService.createPRReview(
        installationId,
        owner,
        repo,
        pullNumber,
        reviewBody,
        'COMMENT',
      );

      this.logger.log(`Successfully posted review for PR #${pullNumber}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to review PR #${pullNumber}: ${errorMessage}`);
      throw error;
    }
  }

  private composeReviewComment(summary: string, fileReviews: string[]): string {
    const header = `## 🤖 Sentinel-Reviewer Analysis\n\n`;
    const summarySection = `### 📋 Summary\n\n${summary}\n\n---\n\n`;
    const reviewsSection = `### 📝 File Reviews\n\n${fileReviews.join('\n\n---\n\n')}`;
    const footer = `\n\n---\n\n<sub>🔍 Powered by Sentinel-Reviewer | [Learn more](https://github.com/your-username/sentinel-reviewer)</sub>`;

    return header + summarySection + reviewsSection + footer;
  }
}
