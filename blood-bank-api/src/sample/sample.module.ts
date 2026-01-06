import { Module } from '@nestjs/common';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';

@Module({
    controllers: [SampleController],
    providers: [SampleService],
    exports: [SampleService],
})
export class SampleModule { }
