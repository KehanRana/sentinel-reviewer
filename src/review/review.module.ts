import { Module, forwardRef } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { GitHubModule } from '../github/github.module.js';
import { OpenAIModule } from '../openai/openai.module.js';

@Module({
  imports: [forwardRef(() => GitHubModule), OpenAIModule],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
