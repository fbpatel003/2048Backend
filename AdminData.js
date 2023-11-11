const mongoose = require("mongoose");

const AdminData = new mongoose.Schema(
    {
        name:String,
        password: String,
        userName: String,
        willGet: Number,
        willGive: Number,
        totalCharges: Number,
        totalComission: Number
    },{
        collection: "Admin Data"
    }
);
mongoose.model("Admin Data", AdminData);