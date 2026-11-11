import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogueRouter from "./catalogue";
import workspaceRouter from "./workspace";
import documentsRouter from "./documents";
import analysesRouter from "./analyses";
import studioRouter from "./studio";
import watchesRouter from "./watches";
import documentReviewsRouter from "./document-reviews";
import webEvidenceRouter from "./web-evidence";
import liveGenerationRouter from "./live-generation";
import paperReviewsRouter from "./paper-reviews";
import customFormatsRouter from "./custom-formats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customFormatsRouter);
router.use(catalogueRouter);
router.use(workspaceRouter);
router.use(documentsRouter);
router.use(analysesRouter);
router.use(studioRouter);
router.use(watchesRouter);
router.use(documentReviewsRouter);
router.use(webEvidenceRouter);
router.use(liveGenerationRouter);
router.use(paperReviewsRouter);

export default router;
