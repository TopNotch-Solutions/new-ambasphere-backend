const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { checkAdmin } = require("../middlewares/authMiddleware");

// Employee Reports
router.get("/employee/demographics", checkAdmin, reportsController.getEmployeeDemographics);
router.get("/employee/status", checkAdmin, reportsController.getEmployeeStatusReport);

// Financial Reports
router.get("/financial/cost-analysis", checkAdmin, reportsController.getCostAnalysisReport);
router.get("/financial/budget", checkAdmin, reportsController.getBudgetReport);

// Device & Package Reports
router.get("/devices/allocation", checkAdmin, reportsController.getDeviceAllocationReport);
router.get("/packages/utilization", checkAdmin, reportsController.getPackageUtilizationReport);

// Analytics & Insights Reports
router.get("/analytics/benefit-utilization", checkAdmin, reportsController.getBenefitUtilizationReport);
router.get("/analytics/trends", checkAdmin, reportsController.getTrendAnalysisReport);

// Compliance & Audit Reports
router.get("/compliance/overview", checkAdmin, reportsController.getComplianceReport);

// Time-based Reports
router.get("/time/monthly", checkAdmin, reportsController.getMonthlyReport);
router.get("/time/quarterly", checkAdmin, reportsController.getQuarterlyReport);

// ROI Reports
router.get("/roi/overview", checkAdmin, reportsController.getROIReport);

module.exports = router;
