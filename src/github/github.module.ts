import { Module, forwardRef } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubController } from './github.controller';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [forwardRef(() => ReviewModule)],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
