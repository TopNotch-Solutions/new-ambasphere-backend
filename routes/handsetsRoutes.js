const express = require("express");
const router = express.Router();
const handsetsController = require("../controllers/handsetsController");
const { tokenAuthMiddleware, checkAllUsers, checkAdmin, checkAdminUser } = require("../middlewares/authMiddleware");

router.use(tokenAuthMiddleware);

router.get("/", checkAdmin, handsetsController.getHandsets);
router.get("/staffHandsets", checkAdmin, handsetsController.getHandsetsOfStaff);
router.post("/", checkAllUsers, handsetsController.postHandset);
router.get("/:employeeCode", checkAllUsers, handsetsController.getHandsetsByStaff);
router.get("/handset/:employeeCode", checkAllUsers, handsetsController.getHandsetsUser);
router.get("/allocations/:allocationID", checkAllUsers, handsetsController.getAllocationsByEmployeeCode);
router.put("/:id", checkAllUsers, handsetsController.updateById);
router.delete("/deletion/:id", checkAllUsers, handsetsController.deleteHandset);


module.exports = router;