import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';

import { Request, Response } from 'express';

let app: any;

async function bootstrap() {
    try {
        if (!app) {
            app = await NestFactory.create(AppModule);

            app.enableCors({
                origin: true, // Allow all origins
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            });

            app.useGlobalPipes(
                new ValidationPipe({
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    transform: true,
                    transformOptions: {
                        enableImplicitConversion: true,
                    },
                }),
            );

            app.setGlobalPrefix('api', {
                exclude: [{ path: '/', method: RequestMethod.GET }],
            });

            await app.init();
        }
        return app;
    } catch (error) {
        console.error('Bootstrap Error:', error);
        throw error;
    }
}

export default async function handler(req: Request, res: Response) {
    const app = await bootstrap();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
