const Handsets = require("../models/Handsets");
const sequelize = require("../config/database");
const logger = require("../middlewares/errorLogger");
const Staff = require("../models/Staff");
const Allocation = require("../models/Allocation");
const { where } = require("sequelize");
const Notifications = require("../models/Notifications");

exports.getHandsets = async (req, res) => {
  try {
    const handsets = await Handsets.findAll();
    console.log("My handset: ",handsets)
    res.status(200).json(handsets);
  } catch (error) {
    logger.error("Error retrieving device details:", error);
    res.status(500).json({
      message: "Failed to retrieve device details:",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

exports.getHandsetsUser = async (req, res) => {
  const employeeCode = req.params.employeeCode;
  try {
    const handsets = await Handsets.findAll({where:{EmployeeCode: employeeCode},order: [['RequestDate', 'DESC']],});
    console.log("My handsets: ",handsets);
    res.status(200).json(handsets);
  } catch (error) {
    logger.error("Error retrieving device details:", error);
    res.status(500).json({
      message: "Failed to retrieve device details:",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

exports.updateById = async (req, res) => {
  const { id } = req.params;
  const { EmployeeCode, MRNumber, CollectionDate, status,FixedAssetCode } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Please provide an ID of the handset you are trying to update",
    });
  }

  try {
    // If status is Approved, MRNumber and CollectionDate must be present
    if (status === "Approved") {
      if (!MRNumber || !CollectionDate) {
        return res.status(400).json({
          message:
            "MRNumber and CollectionDate are required when status is 'Approved'.",
        });
      }
    }

    let renewalDate = null;

    if (CollectionDate) {
      const collection = new Date(CollectionDate);
      const renewal = new Date(collection);
      renewal.setFullYear(renewal.getFullYear() + 2);
      renewalDate = renewal;
    }

    const [updatedCount] = await Handsets.update(
      {
        MRNumber,
        CollectionDate,
        RenewalDate: renewalDate,
        status: CollectionDate ? "Approved" : status,
        FixedAssetCode,
      },
      {
        where: { id },
      }
    );
    const exit = await Handsets.findOne({where:{id}});
    console.log("My current updating data: ", exit, id)
    if (updatedCount === 0) {
      return res.status(404).json({ message: "Handset not found or no changes made." });
    }
   if(status === "Approved"){
     await Notifications.create({
        EmployeeCode: EmployeeCode,
        Type: "Handset Approved",
        Message: `🎉 Your handset request has been approved!\n\nThe device is now assigned to you. Please note your renewal will be due in 2 years from the collection date (${new Date(CollectionDate).toLocaleDateString()}).`,
        Viewed: false,
        Created_At: new Date(),
        RecipientEmployeeCode: EmployeeCode,
      });
   }
   if (status === "Rejected") {
  await Notifications.create({
    EmployeeCode: EmployeeCode,
    Type: "Handset Rejected", // Changed from "Handset Approved"
    Message: `😔 Unfortunately, your recent handset request has been rejected. Please contact IT support for more details.`, // Updated message
    Viewed: false,
    Created_At: new Date(),
    RecipientEmployeeCode: EmployeeCode,
  });
}
    return res.status(200).json({ message: "Handset updated successfully." });
  } catch (error) {
    logger.error("Error updating handset:", error);
    return res.status(500).json({
      message: "Failed to update handset."+ error,
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};
exports.getAllocationsByEmployeeCode = async (req, res) => {
  const allocationID = req.params.allocationID;
  if(!allocationID){
    return res.status(400).json({ message: "Please provide Employee Code" });
  }
  try{
    console.log("My allocation: ",allocationID)
   const myAllocation = await Allocation.findOne({where: {AllocationID: allocationID}});
   console.log("Here is my allocations: ",myAllocation);
   if(!myAllocation){
     return res.status(404).json({ message: "No allocation. Please contact your admin." });
   }
  return res.status(200).json({myAllocation})
  }catch (error) {
    logger.error("Error retrieving device details by staff:", error);
    res.status(500).json({
      message: "Failed to retrieve device details by staff:",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}
exports.getHandsetsByStaff = async (req, res) => {
  try {
    const employeeCode = req.params.employeeCode;

    const staff = await Staff.findOne({ where: { EmployeeCode: employeeCode } });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const [allocationResult] = await sequelize.query(
      `SELECT HandsetAllocation FROM allocation WHERE AllocationID = ? LIMIT 1`,
      { replacements: [staff.AllocationID] }
    );

    const allocation = allocationResult[0];

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // ✅ Validate and parse employmentStartDate
    const employmentStartRaw = staff.EmploymentStartDate;
    if (!employmentStartRaw || isNaN(new Date(employmentStartRaw))) {
      return res.status(400).json({
        message: "Invalid or missing employment start date for staff",
      });
    }

    const employmentStartDate = new Date(employmentStartRaw);
    const twoYearsLater = new Date(employmentStartDate);
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

    const formattedStartDate = employmentStartDate.toISOString().split("T")[0];
    const formattedTwoYearsLater = twoYearsLater.toISOString().split("T")[0];

    const handsets = await Handsets.findAll({where:{EmployeeCode: employeeCode},order: [['RequestDate', 'DESC']],});

    return res.json({
      status: handsets.length === 0 ? 1 : 2,
      handsets,
      handsetAllocation: allocation.HandsetAllocation,
      employmentStartDate: formattedStartDate,
      twoYearsLater: formattedTwoYearsLater,
    });

  } catch (error) {
    logger.error("Error retrieving device details by staff:", error);
    res.status(500).json({
      message: "Failed to retrieve device details by staff",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};


exports.postHandset = async (req, res) => {
  const {
    EmployeeCode,
    AllocationID,
    HandsetName,
    HandsetPrice,
    AccessFeePaid,
    RequestDate,
    CollectionDate,
    RenewalDate,
    status
  } = req.body;

  console.log("Request body: ",req.body)

   if (!EmployeeCode || !HandsetName || HandsetPrice === undefined || AccessFeePaid === undefined) {
    return res.status(400).json({ message: "Please provide all required fields: EmployeeCode, HandsetName, HandsetPrice, AccessFeePaid." });
  }
  try{

      let cleanedHandsetPrice = typeof HandsetPrice === "string" ? HandsetPrice.slice(2) : HandsetPrice;
    cleanedHandsetPrice = parseFloat(cleanedHandsetPrice);

    // Determine status and renewal date based on collection date
    const hasCollectionDate = CollectionDate !== null && CollectionDate !== undefined;
    const finalStatus = status || (hasCollectionDate ? 'Approved' : 'Pending');
    
    let finalRenewalDate = null;
    if (hasCollectionDate && RenewalDate) {
      finalRenewalDate = new Date(RenewalDate);
    }

    const newHandset = await Handsets.create({
      EmployeeCode,
      AllocationID: AllocationID || 1, // Use provided AllocationID or default to 1
      HandsetName,
      HandsetPrice: cleanedHandsetPrice,
      AccessFeePaid: parseFloat(AccessFeePaid) || 0,
      RequestDate: RequestDate ? new Date(RequestDate) : new Date(),
      CollectionDate: hasCollectionDate ? new Date(CollectionDate) : null,
      RenewalDate: finalRenewalDate,
      status: finalStatus
    });

    res.status(201).json({
      message: "Handset record created successfully!",
      handset: newHandset,
    });
  } catch (error) {
    logger.error("Error creating handset record:", error);
    res.status(500).json({
      message: "Failed to create handset record:",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}
exports.getHandsetsOfStaff = async (req, res) => {
  try {
    const staffHandsets = await Handsets.findAll({order: [['RequestDate', 'DESC']],});

    res.status(200).json(staffHandsets);
  } catch (error) {
    logger.error("Error retrieving handset details by staff:", error);
    res.status(500).json({
      message: "Failed to retrieve handset details by staff:",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};
exports.deleteHandset = async (req, res) => {
  const { id } = req.params; // Assuming 'id' refers to ContractNumber

  if (!id) {
    return res.status(400).json({ message: "Please provide the ID of the contract to delete." });
  }

  try {
    const handset = await Handsets.findOne({ where: { id } });

    if (!handset) {
      return res.status(404).json({ message: "Handset not found." });
    }

    if (handset.status !== "Pending") {
      return res.status(403).json({ message: `Handset cannot be deleted. Current approval status is '${handset.status}'. Only 'Pending' contracts can be deleted.` });
    }

    // If ApprovalStatus is 'Pending', proceed with deletion
    await handset.destroy(); // Sequelize's method to delete the instance

    return res.status(200).json({ message: "Handset deleted successfully." });

  } catch (error) {
    console.error("Error deleting contract:", error); // Changed log message for clarity
    res.status(500).json({ message: "Server error during handset deletion. Please try again." }); // More descriptive error
  }
};