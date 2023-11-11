const mongoose = require("mongoose");

const CoreTransactionDetail = new mongoose.Schema(
    {
        userName:String,
        originalAmount:Number,
        calculatedAmount: Number,
        comission: Number,
        charges: Number,
        notes: String,
        gave: Boolean,
        addedOn:Date,
        editedOn:Date,
        updatedBalance: Number,
    },{
        collection: "CoreTransactionDetail"
    }
);

mongoose.model("CoreTransactionDetail", CoreTransactionDetail);