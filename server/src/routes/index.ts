import { Router } from "express";
import { adminRouter } from "./admin";
import { collectionsRouter } from "./collections";
import { communityRouter, publicCommentsRouter } from "./community";
import { configsRouter } from "./configs";
import { exploreRouter } from "./explore";
import { favoritesRouter } from "./favorites";
import { likesRouter } from "./likes";
import { notificationsRouter } from "./notifications";
import { reportsRouter } from "./reports";
import { usersRouter } from "./users";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/configs", configsRouter);
apiRouter.use("/explore", exploreRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/likes", likesRouter);
apiRouter.use("/public", publicCommentsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/collections", collectionsRouter);
apiRouter.use("/admin", adminRouter);
