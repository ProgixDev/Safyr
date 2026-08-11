import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";
import {
  CreateContractSchema,
  UpdateContractSchema,
  type CreateContractDto,
  type UpdateContractDto,
} from "@safyr/schemas/contract";
import { ContractsService } from "./contracts.service";

@Controller("organization/employees/:memberId/contracts")
@UseGuards(AuthGuard)
export class ContractsController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
  ) {
    return this.contracts.list(await this.orgId(req), memberId);
  }

  @Post()
  async create(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Body() body: unknown,
  ) {
    const dto = parseOrThrow(CreateContractSchema, body) as CreateContractDto;
    return this.contracts.create(await this.orgId(req), memberId, dto);
  }

  @Patch(":contractId")
  async update(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Param("contractId") contractId: string,
    @Body() body: unknown,
  ) {
    const dto = parseOrThrow(UpdateContractSchema, body) as UpdateContractDto;
    return this.contracts.update(
      await this.orgId(req),
      memberId,
      contractId,
      dto,
    );
  }

  @Delete(":contractId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Param("contractId") contractId: string,
  ) {
    return this.contracts.remove(await this.orgId(req), memberId, contractId);
  }
}
