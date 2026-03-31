import { Router } from "express";
import { adminRouter } from "./admin";
import { communityRouter, publicCommentsRouter } from "./community";
import { configsRouter } from "./configs";
import { exploreRouter } from "./explore";
import { usersRouter } from "./users";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/configs", configsRouter);
apiRouter.use("/explore", exploreRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/public", publicCommentsRouter);
apiRouter.use("/admin", adminRouter);
