import express, { Router } from "express";
import { RouterFabricConfig } from "./interfaces/RouterFabricConfig.js";
import { HttpMethod } from "../../enum/HttpMethod.js";

export const createDefaultRouter = (config: RouterFabricConfig[]): Router => {
  const router = express.Router();

  config.forEach(({ method, path, controller, validate }) => {
    if (validate) {
      router.use(path, validate);
    }

    switch (method) {
      case HttpMethod.GET:
        router.get(path, controller);
        break;
      case HttpMethod.POST:
        router.post(path, controller);
        break;
      case HttpMethod.PUT:
        router.put(path, controller);
        break;
      case HttpMethod.PATCH:
        router.patch(path, controller);
        break;
      case HttpMethod.DELETE:
        router.delete(path, controller);
        break;
      case HttpMethod.HEAD:
        router.head(path, controller);
        break;
      case HttpMethod.OPTIONS:
        router.options(path, controller);
        break;
      default:
        throw new Error(
          `Указан некорректный метод при создании роутера: ${method}`,
        );
    }
  });

  return router;
};
