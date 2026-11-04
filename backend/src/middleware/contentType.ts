import { Request, Response, NextFunction } from "express";

export function requireJsonContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === "POST" || req.method === "PATCH") {
    const contentLength = req.headers["content-length"];
    // Skip checking if content-length is explicitly "0" (empty body)
    if (contentLength === "0") {
      return next();
    }

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.startsWith("application/json")) {
      res.status(415).json({ error: "Content-Type must be application/json" });
      return;
    }
  }
  next();
}
