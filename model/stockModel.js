const mongoose = require("mongoose");

const stocksSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        enum: ["Electrical", "Plumbing", "Hardware"],
        required: true
    },

    unit: {
        type: String,
        enum: ["Count", "Meter", "Gram"],
        required: true
    },

    minlimit: {
        type: Number,
        required: true,
    },

    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    price: {
        type: Number,
        required: true,
        min: 0
    }
});

module.exports = mongoose.model("Stocks", stocksSchema);