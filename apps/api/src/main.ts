import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // /internal/* is called from arbitrary pages (a bookmarklet/userscript
  // running on rubinot.com.br) and is guarded by INTERNAL_SYNC_TOKEN, not
  // cookies — so it's safe to allow any origin there without `credentials`.
  // Everything else stays locked to CORS_ORIGIN with cookies. A request
  // must hit exactly one of these (never both, to avoid the second
  // middleware's headers clobbering the first's on the actual response).
  const permissiveCors = cors({ origin: true, credentials: false });
  const restrictedCors = cors({ origin: config.get<string>("corsOrigin"), credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    (req.path.startsWith("/internal") ? permissiveCors : restrictedCors)(req, res, next);
  });

  const port = config.get<number>("port")!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Warfire Leidorasga API rodando em http://localhost:${port}`);
}

bootstrap();
