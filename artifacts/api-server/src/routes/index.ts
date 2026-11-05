import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogueRouter from "./catalogue";
import workspaceRouter from "./workspace";
import documentsRouter from "./documents";
import analysesRouter from "./analyses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogueRouter);
router.use(workspaceRouter);
router.use(documentsRouter);
router.use(analysesRouter);

export default router;
