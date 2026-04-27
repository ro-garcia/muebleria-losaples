import { Router } from "express";

import { getDatabaseHealth } from "../controllers/databaseHealthController";
import { getHealth } from "../controllers/healthController";

export const healthRoutes = Router();

healthRoutes.get("/", getHealth);
healthRoutes.get("/database", getDatabaseHealth);
