import { Module, forwardRef } from '@nestjs/common';
import { ReviewService } from './review.service';
import { GitHubModule } from '../github/github.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [forwardRef(() => GitHubModule), OpenAIModule],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
