const mongoose = require("mongoose");

const CRMCustomer = new mongoose.Schema(
    {
        name:String,
        mobileNumber:String,
        email:String,
        address:String,
        defaultCommission:Number,
        userName:String,
        password: String,
        addedOn:Date,
        EditedOn:Date,
        outStanding: Number,
        charges: Number,
        comissionInAmount: Number,
        isActive:Boolean,
        lastTransactionDate:Date
    },{
        collection: "RefCRMCustomer"
    }
);

mongoose.model("RefCRMCustomer", CRMCustomer);