import { CreateReportTemplateDto } from "./create-report-template.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdateReportTemplateDto extends PartialType(CreateReportTemplateDto){

}

