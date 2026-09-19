import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { ReceiptExtractionService } from "./receipt-extraction.service";

@Controller("organization/receipts")
@UseGuards(AuthGuard)
export class ReceiptExtractionController {
  constructor(private readonly extraction: ReceiptExtractionService) {}

  // Multipart (champ « file ») : même contrat que l'extraction de contrat.
  @Post("extract")
  async extract(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException("Aucun fichier reçu.");
    const buffer = await data.toBuffer();
    return this.extraction.extractFromFile(buffer, data.mimetype);
  }
}
