import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import { ReportTemplate } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-reports');

@Injectable()
export class ReportGeneratorService {
    private readonly logger = new Logger(ReportGeneratorService.name)

    private runningTemplateIds = new Set<String>();

    constructor(private prisma: PrismaService){
        if(!fs.existsSync(OUTPUT_DIR)){
            fs.mkdirSync(OUTPUT_DIR, {recursive: true})
        }
    }

    async generate(template: ReportTemplate): Promise<void>{
        if(this.runningTemplateIds.has(template.id)){
            this.logger.warn(`Skipping run for template ${template.id} — previous run still in progress`)
            return;
        }
        this.runningTemplateIds.add(template.id);
        const run = await this.prisma.reportRun.create({
            data: {
                reportTemplateId: template.id,
                status: 'PENDING',
                runStarted: new Date(),
            }
        })
        try {
            const data = await this.fetchReportData(template.reportType)
            const filePath = template.outputFormat === 'PDF' ? await this.generatePdf(template, data, run.id)
            : await this.generateExcel(template, data, run.id)

            await this.prisma.reportRun.update({
                where: {id: run.id},
                data: {
                    status: 'SUCCESS',
                    filePath,
                    runEnded: new Date(),
                }
            })
            this.logger.log(`Report generated successfully: ${filePath}`)
        } catch (error: any) {
            this.logger.error(`Report generation failed for run ${run.id}`, error)

            await this.prisma.reportRun.update({
                where: {id: run.id},
                data: {
                    status: 'FAILED',
                    errorMessage: error.message || 'Unknown error',
                    runEnded: new Date()
                }
            })
        } finally{
            this.runningTemplateIds.delete(template.id)
        }
    }

    private async fetchReportData(reportType: string){
         switch(reportType){
            case 'ORDERS_SUMMARY':
                return this.fetchOrdersSummaryData();
            default:
                throw new Error(`Unsupported report type: ${reportType}`)
         }
    }

    private async fetchOrdersSummaryData(){
        return [
            { orderId: 'ORD-1001', customer: 'Acme Corp', amount: 15000.5, date: '2026-08-01' },
      { orderId: 'ORD-1002', customer: 'Beta LLC', amount: 8200.0, date: '2026-08-03' },
      { orderId: 'ORD-1003', customer: 'Gamma Inc', amount: 42300.75, date: '2026-08-05' },
        ]
    }

    private generatePdf(template: ReportTemplate, data: any[], runId: string): Promise<string>{
        return new Promise((resolve, reject) => {
            const fileName = `${template.name.replace(/\s+/g, '_')}_${runId}.pdf`;
            const filePath = path.join(OUTPUT_DIR, fileName);
            const doc = new PDFDocument()
            const stream = fs.createWriteStream(filePath)

            doc.pipe(stream);

            doc.fontSize(18).text(template.name, {align: 'center'})
            doc.moveDown()
            doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' })
            doc.moveDown(2);

            data.forEach((row) => {
                doc.fontSize(11).text(`${row.orderId}  |  ${row.customer}  |  ₹${row.amount}  |  ${row.date}`)
            })
            doc.end()

            stream.on('finish', () => resolve(filePath))
            stream.on('error', reject)

        })
    }

    private async generateExcel(template: ReportTemplate, data: any[], runId: string):Promise<string>{
        const fileName = `${template.name.replace(/\s+/g, '_')}_${runId}.xlsx`;
        const filePath = path.join(OUTPUT_DIR, fileName)

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(template.name)

        sheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
        ]
        sheet.addRows(data)
        sheet.getRow(1).font = {bold:true}

        await workbook.xlsx.writeFile(filePath)
        return filePath
    }
}
