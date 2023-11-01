const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());

const mongoURL =
  "mongodb+srv://FbPatel:Fenil1998@cluster0.i4p5593.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to mongo DB");
  })
  .catch((e) => console.log(e));

require("./AdminData");
const AdminUser = mongoose.model("Admin Data");

require("./RefCRMCustomer");
const CRMCustomer = mongoose.model("RefCRMCustomer");

require("./CoreTransactionsDetail");
const CoreTransactions = mongoose.model("CoreTransactionDetail");

app.post("/login", async (req, res) => {
  try {
    if (req.body.userName == "Admin") {
      const admin = await AdminUser.findOne(req.body);
      if (!admin) {
        return res.json({
          isError: true,
          ErrorMessege: "InValid UserName or Password!",
        });
      } else {
        return res.json({
          isError: false,
          data: admin,
        });
      }
    } else {
      const user = await CRMCustomer.findOne({
        userName: req.body.userName,
        password: req.body.password,
        isActive: true,
      });

      if (!user) {
        res.json({
          isError: true,
          ErrorMessege: "InValid UserName or Password!",
        });
      } else {
        return res.json({
          isError: false,
          data: user,
        });
      }
    }
  } catch (ex) {
    return res.json({
      isError: true,
      ErrorMessege: ex,
    });
  }
});

app.post("/addNewCustomer", async (req, res) => {
  try {
    const user = await CRMCustomer.findOne({ userName: req.body.userName });
    if (user) {
      return res.json({
        isError: true,
        ErrorMessege: "Same UserName found!",
      });
    } else {
      const newData = req.body;
      const createdData = await CRMCustomer.create(newData);
      return res.json({
        isError: false,
        data: createdData,
      });
    }
  } catch (ex) {
    return res.json({
      isError: true,
      ErrorMessege: ex,
    });
  }
});

app.post("/getAllCustomersByStatus", async (req, res) => {
  try {
    const allData = await CRMCustomer.find({
      isActive: req.body.isActive,
    }).sort({ lastTransactionDate: -1 });
    return res.json({
      isError: false,
      data: allData,
    });
  } catch (ex) {
    return res.json({
      isError: true,
      ErrorMessege: ex,
    });
  }
});

app.post("/getUserAndTransactionDataByUserName", async (req, res) => {
  try {
    const userData = await CRMCustomer.findOne({ userName: req.body.userName });
    const allTransactions = await CoreTransactions.find({
      userName: req.body.userName,
    }).sort({ addedOn: -1 });
    return res.json({
      isError: false,
      data: { userData, allTransactions },
    });
  } catch (ex) {
    return res.json({
      isError: true,
      ErrorMessege: ex,
    });
  }
});

app.post("/addTransaction", async (req, res) => {
  try {
    const userName = req.body.userName;
    const userData = await CRMCustomer.findOne({ userName: req.body.userName });

    const calculated =
      req.body.originalAmount -
      (req.body.originalAmount * req.body.comission) / 100;
    const updated = req.body.gave
      ? userData.outStanding - calculated
      : userData.outStanding + calculated;
    const transaction = {
      userName: userName,
      originalAmount: req.body.originalAmount,
      calculatedAmount: calculated,
      comission: req.body.comission,
      charges: req.body.charges,
      notes: req.body.notes,
      gave: req.body.gave,
      addedOn: new Date(),
      editedOn: new Date(),
      updatedBalance: updated,
    };

    const createdTransaction = await CoreTransactions.create(transaction);
    const newUserData = await CRMCustomer.findOneAndUpdate(
      { userName: userName },
      { $set: { lastTransactionDate: new Date(), outStanding: updated } },
      { new: true }
    );

    const willGet = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $lt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]);

    const willGive = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $gt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]);

    var get = 0;
    var give = 0;

    if (willGet.length > 0) get = willGet[0].sum;
    if (willGive.length > 0) give = willGive[0].sum;

    const newAdminData = await AdminUser.findOneAndUpdate(
      { userName: "Admin" },
      { $set: { willGet: get, willGive: give } },
      { new: true }
    );

    return res.json({
      isError: false,
      data: { createdTransaction, newUserData, newAdminData },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      isError: true,
      ErrorMessege: error,
    });
  }
});

app.post("/editTransactionOld", async (req, res) => {
  try {
    const oldTransactionData = await CoreTransactions.findById(req.body._id);
    const justBeforeTransaction = await CoreTransactions.findOne({
      addedOn: { $lt: req.body.addedOn },
      userName: req.body.userName,
    }).sort({ addedOn: -1 });

    var lastUpdated = 0;
    if (justBeforeTransaction != null)
      lastUpdated = justBeforeTransaction.updatedBalance;
    const calculated =
      req.body.originalAmount -
      (req.body.originalAmount * req.body.comission) / 100;

    const updated = req.body.gave
      ? lastUpdated - calculated
      : lastUpdated + calculated;

    const updatedTransaction = await CoreTransactions.findOneAndUpdate(
      { _id: req.body._id },
      {
        $set: {
          originalAmount: req.body.originalAmount,
          calculatedAmount: calculated,
          comission: req.body.comission,
          charges: req.body.charges,
          notes: req.body.notes,
          editedOn: new Date(),
          updatedBalance: updated,
        },
      },
      { new: true }
    );

    const subsequentTransactions = await CoreTransactions.find({
      addedOn: { $gt: updatedTransaction.addedOn },
      userName: req.body.userName,
    }).sort({ addedOn: -1 });

    const updateOperations = subsequentTransactions.map((transaction) => {
      var updatedBalance = transaction.updatedBalance;
      var balanceToSet = 0;

      if (updatedTransaction.gave) {
        if (
          updatedTransaction.calculatedAmount >
          oldTransactionData.calculatedAmount
        ) {
          const diff =
            updatedTransaction.calculatedAmount -
            oldTransactionData.calculatedAmount;
          balanceToSet = updatedBalance - diff;
        } else {
          const diff =
            oldTransactionData.calculatedAmount -
            updatedTransaction.calculatedAmount;
          balanceToSet = updatedBalance + diff;
        }
      } else {
        if (
          updatedTransaction.calculatedAmount >
          oldTransactionData.calculatedAmount
        ) {
          const diff =
            updatedTransaction.calculatedAmount -
            oldTransactionData.calculatedAmount;
          balanceToSet = updatedBalance + diff;
        } else {
          const diff =
            oldTransactionData.calculatedAmount -
            updatedTransaction.calculatedAmount;
          balanceToSet = updatedBalance - diff;
        }
      }

      return {
        updateOne: {
          filter: { _id: transaction._id },
          update: { $set: { updatedBalance: balanceToSet } },
        },
      };
    });

    await CoreTransactions.bulkWrite(updateOperations);

    const latestTransaction = await CoreTransactions.findOne({
      addedOn: { $gte: updatedTransaction.addedOn },
      userName: req.body.userName,
    });

    const latestUpdatedBalance = latestTransaction.updatedBalance;

    const newUserData = await CRMCustomer.findOneAndUpdate(
      { userName: userName },
      {
        $set: {
          lastTransactionDate: new Date(),
          outStanding: latestUpdatedBalance,
        },
      }
    );

    const willGet = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $lt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]);

    const willGive = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $gt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]);

    var get = 0;
    var give = 0;

    if (willGet.length > 0) get = willGet[0].sum;
    if (willGive.length > 0) give = willGive[0].sum;

    const newAdminData = await AdminUser.findOneAndUpdate(
      { userName: "Admin" },
      { $set: { willGet: get, willGive: give } },
      { new: true }
    );

    return res.json({
      isError: false,
      data: "Transaction Updated Successfully",
    });
  } catch (error) {
    return res.json({
      isError: true,
      ErrorMessege: error.toString(),
    });
  }
});

app.post("/editTransaction", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const options = { session };

    const oldTransactionData = await CoreTransactions.findById(
      req.body._id
    ).session(session);

    const justBeforeTransaction = await CoreTransactions.findOne({
      addedOn: { $lt: req.body.addedOn },
      userName: req.body.userName,
    })
      .sort({ addedOn: -1 })
      .session(session);

    var lastUpdated = 0;
    if (justBeforeTransaction != null)
      lastUpdated = justBeforeTransaction.updatedBalance;
    const calculated =
      req.body.originalAmount -
      (req.body.originalAmount * req.body.comission) / 100;

    const updated = req.body.gave
      ? lastUpdated - calculated
      : lastUpdated + calculated;

    const updatedTransaction = await CoreTransactions.findOneAndUpdate(
      { _id: req.body._id },
      {
        $set: {
          originalAmount: req.body.originalAmount,
          calculatedAmount: calculated,
          comission: req.body.comission,
          charges: req.body.charges,
          notes: req.body.notes,
          editedOn: new Date(),
          updatedBalance: updated,
        },
      },
      { new: true, session }
    );

    const subsequentTransactions = await CoreTransactions.find({
      addedOn: { $gt: updatedTransaction.addedOn },
      userName: req.body.userName,
    })
      .sort({ addedOn: -1 })
      .session(session);

    const updateOperations = subsequentTransactions.map((transaction) => {
      var updatedBalance = transaction.updatedBalance;
      var balanceToSet = 0;

      if (updatedTransaction.gave) {
        if (
          updatedTransaction.calculatedAmount >
          oldTransactionData.calculatedAmount
        ) {
          const diff =
            updatedTransaction.calculatedAmount -
            oldTransactionData.calculatedAmount;
          balanceToSet = updatedBalance - diff;
        } else {
          const diff =
            oldTransactionData.calculatedAmount -
            updatedTransaction.calculatedAmount;
          balanceToSet = updatedBalance + diff;
        }
      } else {
        if (
          updatedTransaction.calculatedAmount >
          oldTransactionData.calculatedAmount
        ) {
          const diff =
            updatedTransaction.calculatedAmount -
            oldTransactionData.calculatedAmount;
          balanceToSet = updatedBalance + diff;
        } else {
          const diff =
            oldTransactionData.calculatedAmount -
            updatedTransaction.calculatedAmount;
          balanceToSet = updatedBalance - diff;
        }
      }

      return {
        updateOne: {
          filter: { _id: transaction._id },
          update: { $set: { updatedBalance: balanceToSet } },
        },
      };
    });

    await CoreTransactions.bulkWrite(updateOperations, { session });

    const latestTransaction = await CoreTransactions.findOne({
      addedOn: { $gte: updatedTransaction.addedOn },
      userName: req.body.userName,
    }).session(session);

    const latestUpdatedBalance = latestTransaction.updatedBalance;

    const newUserData = await CRMCustomer.findOneAndUpdate(
      { userName: userName },
      {
        $set: {
          lastTransactionDate: new Date(),
          outStanding: latestUpdatedBalance,
        },
      },
      { new: true, session } 
    );

    const willGet = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $lt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]).session(session);

    const willGive = await CRMCustomer.aggregate([
      {
        $match: { outStanding: { $gt: 0 }, isActive: true },
      },
      { $group: { _id: null, sum: { $sum: "$outStanding" } } },
    ]).session(session);

    var get = 0;
    var give = 0;

    if (willGet.length > 0) get = willGet[0].sum;
    if (willGive.length > 0) give = willGive[0].sum;

    const newAdminData = await AdminUser.findOneAndUpdate(
      { userName: "Admin" },
      { $set: { willGet: get, willGive: give } },
      { new: true, session }
    );

    await session.commitTransaction();

    return res.json({
      isError: false,
      data: "Transaction Updated Successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    return res.json({
      isError: true,
      ErrorMessege: error.toString(),
    });
  } finally {
    session.endSession();
  }
});

app.post("/deleteCustomer", async (req, res) => {
  try {
    const newUserData = await CRMCustomer.findOneAndUpdate(
      { userName: req.body.userName },
      { isActive: false, EditedOn: new Date() },
      { new: true }
    );

    return res.json({
      isError: false,
      data: newUserData,
    });
  } catch (error) {
    return res.json({
      isError: true,
      ErrorMessege: error,
    });
  }
});

app.post("/editCustomerDetails", async (req, res) => {
  try {
    const newUserData = await CRMCustomer.findOneAndUpdate(
      { userName: req.body.userName },
      {
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        email: req.body.email,
        address: req.body.address,
        defaultCommission: req.body.defaultCommission,
        password: req.body.password,
        EditedOn: new Date(),
      },
      { new: true }
    );

    return res.json({
      isError: false,
      data: newUserData,
    });
  } catch (error) {
    return res.json({
      isError: true,
      ErrorMessege: error,
    });
  }
});

app.post("/getAdminDetails", async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ userName: "Admin" });

    return res.json({
      isError: false,
      data: {
        willGive: admin.willGive,
        willGet: admin.willGet,
      },
    });
  } catch (error) {
    return res.json({
      isError: true,
      ErrorMessege: error,
    });
  }
});

app.listen(5000, () => {
  console.log("server started");
});
