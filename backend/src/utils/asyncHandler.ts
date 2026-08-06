import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * This app only uses named route params (`/conversations/:id`), never wildcards.
 * Express 5's ParamsDictionary types params as string|string[] — widen to any
 * rather than fighting the types; zod validation covers runtime shapes.
 */
export type LinkPilotRequest = Request<any, any, any, import('qs').ParsedQs>;

type AsyncHandler = (req: LinkPilotRequest, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap async route handlers so rejections reach the central error middleware. */
export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req as unknown as LinkPilotRequest, res, next).catch(next);
  };
}
