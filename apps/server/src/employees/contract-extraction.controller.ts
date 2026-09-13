import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { ContractExtractionService } from "./contract-extraction.service";

@Controller("organization/contracts")
@UseGuards(AuthGuard)
export class ContractExtractionController {
  constructor(private readonly extraction: ContractExtractionService) {}

  @Post("extract")
  async extract(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("Aucun fichier reçu.");
    }
    const buffer = await data.toBuffer();
    return this.extraction.extractFromFile(buffer, data.mimetype);
  }
}
