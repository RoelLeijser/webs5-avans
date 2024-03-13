import { log } from "console";
import { RequestHandler, Request, Response, NextFunction } from "express";
import proxy from "express-http-proxy";
import CircuitBreaker from "opossum";

const circuitBreakerOptions = {
  timeout: 3000, // 3 seconds
  errorThresholdPercentage: 10, // 10% of requests can fail
  resetTimeout: 30 * 1000, // 30 seconds
};
const proxyHandler = (
  url: string,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return new Promise((resolve, reject) => {
    proxy(url, {
      userResDecorator: (_, data) => {
        resolve(data);
        return data;
      },
      proxyErrorHandler(err, _, next) {
        reject(err);
      },
    })(req, res, next);
  });
};
const circuitBreaker = new CircuitBreaker(proxyHandler, circuitBreakerOptions);

circuitBreaker.on("open", () => {
  log("Circuit breaker opened");
});

circuitBreaker.on("halfOpen", () => {
  log("Circuit breaker half-opened");
});

circuitBreaker.on("close", () => {
  log("Circuit breaker closed");
});

export const requestWrapper = (url: string): RequestHandler => {
  return (req, res, next) => {
    circuitBreaker.fallback(() => {
      res.status(500).json({ error: "Service temporarily unavailable" });
    });
    circuitBreaker.fire(url, req, res, next);
  };
};
