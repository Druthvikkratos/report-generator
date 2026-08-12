-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OutputFormat" AS ENUM ('PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ORDERS_SUMMARY');

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" "ReportType" NOT NULL DEFAULT 'ORDERS_SUMMARY',
    "schedule_frequency" "ScheduleFrequency" NOT NULL,
    "specific_time_to_run" TIME NOT NULL,
    "day_of_week" INTEGER,
    "ouput_format" "OutputFormat" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_run" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "file_path" TEXT,
    "error_message" TEXT,
    "run_started" TIMESTAMP(3) NOT NULL,
    "run_ended" TIMESTAMP(3),
    "reportTemplateId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_run_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "report_run" ADD CONSTRAINT "report_run_reportTemplateId_fkey" FOREIGN KEY ("reportTemplateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
