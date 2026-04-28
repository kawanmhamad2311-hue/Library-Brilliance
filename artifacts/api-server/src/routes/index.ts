import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import feedbackRouter from "./feedback";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(feedbackRouter);
router.use(adminRouter);

export default router;
