const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Allocation = require("./Allocation");

const Staff = sequelize.define(
  "employees",
  {
    EmployeeCode: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    RoleID: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "roles",
        key: "RoleID",
      },
    },
    AllocationID: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "allocation",
        key: "AllocationID",
      },
    },
    FirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    FullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    UserName:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    PhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ServicePlan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Division: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmploymentCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmploymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EmploymentStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ProfileImage: {
      type: DataTypes.JSON,
      allowNull: true, 
      required: false
    },
  },
  {
    timestamps: false,
  }
);

Staff.associate = (models) => {
  Staff.hasMany(models.Contracts, {
    foreignKey: "EmployeeCode",
    sourceKey: "EmployeeCode",
  });
  Staff.hasMany(models.Image, {
    foreignKey: "EmployeeCode",
    sourceKey: "EmployeeCode",
  });
  Staff.hasMany(models.Handsets, {
    foreignKey: "EmployeeCode",
    sourceKey: "EmployeeCode",
  });
  Staff.hasMany(models.Notifications, {
    foreignKey: "EmployeeCode",
    sourceKey: "EmployeeCode",
  });
  Staff.belongsTo(Allocation, { foreignKey: "AllocationID", targetKey: "AllocationID" });
};




module.exports = Staff;