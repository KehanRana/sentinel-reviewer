import { Module, forwardRef } from '@nestjs/common';
import { GitHubService } from './github.service.js';
import { GitHubController } from './github.controller.js';
import { ReviewModule } from '../review/review.module.js';

@Module({
  imports: [forwardRef(() => ReviewModule)],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
