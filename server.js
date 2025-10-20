const express = require("express");
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http"); // Import http module
const multer = require("multer"); // Import multer
const socketIo = require("socket.io");
const cron = require("node-cron");
const morgan = require("morgan");
const logger = require("./middlewares/errorLogger");
const errorHandler = require("./middlewares/errorHandlerMiddleware");
const path = require("path");

require("dotenv").config();
const { tokenAuthMiddleware } = require("./middlewares/authMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const imageRoutes = require("./routes/imageRoutes");
const staffRoutes = require("./routes/staffRoutes");
const handsetRoutes = require("./routes/handsetsRoutes");
const packagesRoutes = require("./routes/packagesRoutes");
const contractsRoutes = require("./routes/contractsRoutes");
const excelFileUploadRoute = require("./routes/excelFIleUploadRoute");
const notificationsRoutes = require("./routes/notificationsRoutes");
const priceListRoutes = require("./routes/priceListRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const emailRoutes = require("./routes/emailRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const financeRoutes = require("./routes/financeRoutes");
const Handsets = require("./models/Handsets");
const { where, Op } = require("sequelize");
const Notifications = require("./models/Notifications");
const Contracts = require("./models/Contracts");

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Authorization', 'X-Refresh-Token'],
  },
});

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(bodyParser.json({ limit: "50mb" }));

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://uat-portal.erongored.com.na"],
    
   // origin: "http://mtcprdstaffapp01.mtcdc.com.na",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Authorization', 'X-Refresh-Token'],
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Defining the routes

//authentication API Calls
app.use("/auth", authRoutes);

// Staff API Calls
app.use("/staffmember", staffRoutes);

// Device API Calls
app.use("/handsets", handsetRoutes);


// Package API Calls
app.use("/packages", packagesRoutes);

// Contract API Calls
app.use("/contracts", contractsRoutes);

// Profile Picture API Calls
app.use("/image", imageRoutes);

// Excel API Calls
app.use("/excel", excelFileUploadRoute);

// Notification API Calls
app.use("/notifications", notificationsRoutes);

// Price List API Calls
app.use("/pricelist", priceListRoutes);

// Events API Calls
app.use("/events", eventsRoutes);

// Email API Calls
app.use("/email", emailRoutes);

// Reports API Calls
app.use("/reports", reportsRoutes);

// Finance API Calls
app.use("/finance", financeRoutes);

app.use("/*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

cron.schedule("0 1 14 * *", async () => {
  try {
    const airtimeController = require("./controllers/airtimeController"); // Import your controller

    await airtimeController.allocateMonthly(); // Call the controller function

    console.log("Airtime allocated successfully.");
  } catch (error) {
    console.error("Error allocating airtime:", error);
  }
});

cron.schedule('0 * * * *', async () => {
  try{
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const approachingRenewals = await Handsets.findAll({
      where: {
        RenewalDate: {
          [Op.between]: [now, sevenDaysFromNow]
        },
        weekNotificationSend: false
      }
    });
    console.log('🔍 Approaching renewals:', approachingRenewals.length);

     for (let handset of approachingRenewals) {
      console.log(`Notify: ${handset.HandsetName} - Renewal on ${handset.RenewalDate}`);

    await Notifications.create({
        EmployeeCode: handset.EmployeeCode,
        Type: "Handset Renewal",
        Message: `🎉 Hey, \nexciting news! Your handset is due for renewal in just 7 days! 
Get ready to upgrade your device and enjoy the latest tech, all thanks to your MTC handset allowance. 
Don't miss your chance to claim your new device! 🚀📱`,
        Viewed: false,
        Created_At: new Date(),
        RecipientEmployeeCode: handset.EmployeeCode,
      });
      await Handsets.update({weekNotificationSend: true},{where:{id: handset.id}})
    }
  }catch (error) {
    console.error('❌ Hourly cron job error:', error);
  }
});

cron.schedule('0 * * * *', async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const dueTodayHandsets = await Handsets.findAll({
      where: {
        RenewalDate: {
          [Op.between]: [todayStart, todayEnd]
        },
        renewalNotificationSend: false
      }
    });

    console.log('📢 Handsets due today:', dueTodayHandsets.length);

    for (let handset of dueTodayHandsets) {
      const message = `📱 Hey, \nremember the message from last week? 
🎉 Your handset is now ready for renewal today!
Head over to the device center and enjoy your MTC upgrade! 🚀`;

      await Notifications.create({
        EmployeeCode: handset.EmployeeCode,
        Type: 'Handset Renewal Today',
        Message: message,
        Viewed: false,
        Created_At: new Date(),
        RecipientEmployeeCode: handset.EmployeeCode,
      });
      await Handsets.update(
    { renewalNotificationSend: true },
    { where: { id: handset.id } }
  );
    }
    
  } catch (error) {
    console.error('❌ Renewal-day cron job error:', error);
  }
});


//Contracts
cron.schedule('* * * * *', async () => {
  try{
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const approachingEnd = await Contracts.findAll({
      where: {
        ContractEndDate: {
          [Op.between]: [now, sevenDaysFromNow]
        },
        weekNotificationSend: false
      }
    });
    console.log('🔍 Approaching end date:', approachingEnd.length);

     for (let contract of approachingEnd) {
      await Contracts.update({weekNotificationSend: true},{where:{ContractNumber: contract.ContractNumber}})
    await Notifications.create({
        EmployeeCode: contract.EmployeeCode,
        Type: "Important: Your Contract Renewal is 7 Days Away!",
        Message: `Dear Valued Employee, This is a friendly reminder that your MTC contract is due for renewal in just 7 days.
        Don't miss this opportunity to enhance your mobile experience!`,
        Viewed: false,
        Created_At: new Date(),
        RecipientEmployeeCode: contract.EmployeeCode,
      });
      
    }
  }catch (error) {
    console.error('❌ Hourly cron job error:', error);
  }
});

cron.schedule('* * * * *', async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const dueTodayContract = await Contracts.findAll({
      where: {
        ContractEndDate: {
          [Op.between]: [todayStart, todayEnd]
        },
        endNotificationSend: false
      }
    });

    console.log('📢 contract end today:', dueTodayContract.length);

    for (let contract of dueTodayContract) {
      const message = `Dear Valued Employee,
      Your MTC contract is officially due for renewal today.
      This is your opportunity to upgrade your device and utilize your MTC allowance for the latest technology.
      Ensure a seamless transition to your new contract! `;
      await Contracts.update(
    { endNotificationSend: true, SubscriptionStatus: "Expired" },
    { where: { ContractNumber: contract.ContractNumber } }
  );
      await Notifications.create({
        EmployeeCode: contract.EmployeeCode,
        Type: 'Action Required: Your Contract Expires Today!',
        Message: message,
        Viewed: false,
        Created_At: new Date(),
        RecipientEmployeeCode: contract.EmployeeCode,
      });
      
    }
    
  } catch (error) {
    console.error('❌ Renewal-day cron job error:', error);
  }
});

// Error handling middleware
// app.use((error, req, res, next) => {
//   console.error(error);
//   const status = error.statusCode || 500;
//   const message = error.message;
//   const data = error.data;
//   res.status(status).json({ message: message, data: data });
// });

app.use(errorHandler);

sequelize.options.logging = console.log;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
    server.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running on port ${process.env.PORT || 4000}`);
    });
  })
  .catch((error) => {
    logger.error("Error synchronizing database:", error);
  });

// Socket.IO event handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    logger.error("Socket error:", error);
  });
});

module.exports.io = io;
