import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
    });
  }

  async reviewCode(
    filename: string,
    patch: string,
    fileContent?: string,
  ): Promise<string> {
    this.logger.log(`Reviewing file: ${filename}`);

    const systemPrompt = `You are an expert code reviewer named Sentinel-Reviewer. 
Your job is to review code changes in pull requests and provide constructive, actionable feedback.

Guidelines:
- Focus on bugs, security issues, performance problems, and code quality
- Be concise but thorough
- Suggest specific improvements with code examples when helpful
- Be respectful and constructive
- If the code looks good, acknowledge it briefly
- Format your response in markdown for GitHub comments`;

    const userPrompt = `Please review the following code change:

**File:** ${filename}

**Diff/Patch:**
\`\`\`diff
${patch}
\`\`\`

${fileContent ? `**Full file context:**\n\`\`\`\n${fileContent}\n\`\`\`` : ''}

Provide a focused code review with any issues, suggestions, or positive observations.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || 'Unable to generate review.';
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async summarizePR(
    title: string,
    description: string,
    filesChanged: string[],
  ): Promise<string> {
    const prompt = `Summarize this pull request:
    
**Title:** ${title}
**Description:** ${description || 'No description provided'}
**Files Changed:** ${filesChanged.join(', ')}

Provide a brief summary of what this PR appears to do.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes pull requests concisely.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }
}
