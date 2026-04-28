import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import feedbackRouter from "./feedback";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(feedbackRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(storageRouter);

export default router;
