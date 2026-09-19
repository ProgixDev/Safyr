import { Module } from "@nestjs/common";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { SubcontractorsController } from "./subcontractors.controller";
import { SubcontractorsService } from "./subcontractors.service";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";
import { ReceiptExtractionController } from "./receipt-extraction.controller";
import { ReceiptExtractionService } from "./receipt-extraction.service";
import { StorageModule } from "@/storage/storage.module";

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [
    ClientsController,
    SubcontractorsController,
    AttachmentsController,
    ReceiptExtractionController,
  ],
  providers: [
    ClientsService,
    SubcontractorsService,
    AttachmentsService,
    ReceiptExtractionService,
  ],
})
export class EntrepriseModule {}
