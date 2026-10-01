const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // ID of the product in the Stocks collection
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stocks",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    transactionDate: {
      type: String,
      required: true,
    },

    transactionTime: {
      type: String,
      required: true,
    },

    transactionType: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete history after 30 days
transactionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

module.exports = mongoose.model("Transaction", transactionSchema);

