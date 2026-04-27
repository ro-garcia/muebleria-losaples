import type { Request, Response } from "express";

export const getHealth = (_request: Request, response: Response) => {
  response.status(200).json({
    ok: true,
    message: "Backend funcionando correctamente",
  });
};


