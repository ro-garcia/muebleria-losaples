import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { healthRoutes } from "./routes/healthRoutes";

const app = express(); 

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});
