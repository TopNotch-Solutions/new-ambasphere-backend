const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Staff = require("./Staff");

const Handsets = sequelize.define(
  "handsets",
  {
     id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    FixedAssetCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmployeeCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    AllocationID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    MRNumber:{
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    HandsetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    HandsetPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    AccessFeePaid: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    RequestDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    CollectionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    RenewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    weekNotificationSend:{
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    renewalNotificationSend:{
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
  type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'In-progress'),
  allowNull: false,
  defaultValue: 'Pending',
  validate: {
    isIn: {
      args: [['Pending', 'Approved', 'Rejected', 'In-progress']],
      msg: "Status must be either 'Pending', 'Approved', 'Rejected' or 'In-progress'"
    }
  }
}

  },
  {
    timestamps: false,
  }
);
Handsets.associate = (models) => {
  Handsets.belongsTo(models.Employees, {
    foreignKey: "EmployeeCode",
    targetKey: "EmployeeCode",
  });
};
module.exports = Handsets;
