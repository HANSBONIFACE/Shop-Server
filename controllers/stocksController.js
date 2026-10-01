const Stocks = require('../model/stockModel');
const History = require('../model/historyModel');

//Add New Stock

exports.addStock = async (req, res) => {
    console.log("Request received");

    const {
        pname,
        category,
        unit,
        minlimit,
        quantity,
        pprice
    } = req.body;

    try {
        // Validate required fields
        if (
            !pname ||
            !category ||
            !unit ||
            minlimit == null ||
            quantity == null ||
            pprice == null
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if product already exists
        const existingProduct = await Stocks.findOne({
            productname: pname
        });

        if (existingProduct) {
            return res.status(409).json({
                message: "Product Already Exists"
            });
        }

        //---------------------------------------------------Create product-----------------------------------------
        const newProduct = new Stocks({
            productname: pname,
            category,
            unit,
            minlimit: Number(minlimit),
            quantity: Number(quantity),
            price: Number(pprice)
        });

        await newProduct.save();

        // Get current date and time
        const now = new Date();

        const transactionDate = now.toLocaleDateString("en-IN");
        const transactionTime = now.toLocaleTimeString("en-IN");

        // Add transaction to history
        const history = new History({
            productId: newProduct._id,
            productName: newProduct.productname,
            transactionDate: transactionDate,
            transactionTime: transactionTime,
            transactionType: "Product Added",
            quantity: newProduct.quantity,
            price: newProduct.price
        });

        await history.save();

        // Send success response
        return res.status(201).json({
            message: "Product Added Successfully",
            product: newProduct
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

//---------------------------------------Get Existing Stocks----------------------------------------------
exports.getStocks = async (req, res) => {
    try {
        const allStocks = await Stocks.find()
        res.status(200).json(allStocks)
    }
    catch (error) {
        res.status(500).json(error)
    }
}


//-------------------------------------Edit Existing Stocks-----------------------------------------------
exports.editStock = async (req, res) => {
    const { id } = req.params;

    const {
        pname,
        category,
        unit,
        lpm,
        minlimit,
        quantity,
        pprice
    } = req.body;

    try {

        // Check if product exists
        const existingStock = await Stocks.findById(id);

        if (!existingStock) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Convert values to numbers
        const numericMinlimit = Number(minlimit);
        const numericQuantity = Number(quantity);
        const numericPrice = Number(pprice);

        // Validate numbers
        if (
            !Number.isFinite(numericMinlimit) ||
            !Number.isFinite(numericQuantity) ||
            !Number.isFinite(numericPrice)
        ) {
            return res.status(400).json({
                message: "Min limit, quantity and price must be valid numbers",
                received: {
                    minlimit,
                    quantity,
                    pprice
                }
            });
        }

        // Update product
        const updatedstock = await Stocks.findByIdAndUpdate(
            id,
            {
                productname: pname,
                category,
                unit,
                lpm,
                minlimit: numericMinlimit,
                quantity: numericQuantity,
                price: numericPrice
            },
            {
                returnDocument: "after"
            }
        );

        // Get current date and time
        const now = new Date();

        const transactionDate =
            now.toLocaleDateString("en-IN");

        const transactionTime =
            now.toLocaleTimeString("en-IN");

        // Add edited product to history
        const history = new History({
            productId: updatedstock._id,
            productName: updatedstock.productname,
            transactionDate,
            transactionTime,
            transactionType: "Product Edited",
            quantity: updatedstock.quantity,
            price: updatedstock.quantity * updatedstock.price,
            undoAvailable: true
        });

        await history.save();

        return res.status(200).json({
            message: "Stock updated Successfully",
            updatedstock
        });

    } catch (error) {

        console.log("EDIT STOCK ERROR:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

//Edit Purchased Stock

exports.purchaseStock = async (req, res) => {
    const { id } = req.params;

    // Get quantity from request
    const quantity = Number(req.body.soldQty);

    console.log("Request Body:", req.body);
    console.log("Request Params:", req.params);
    console.log("Quantity:", quantity);

    try {

        // ---------------------------------------
        // BASIC VALIDATION
        // ---------------------------------------

        if (!Number.isFinite(quantity)) {
            return res.status(400).json({
                message: "Invalid quantity"
            });
        }

        if (quantity === 0) {
            return res.status(400).json({
                message: "Quantity cannot be zero"
            });
        }

        // ---------------------------------------
        // FIND STOCK
        // ---------------------------------------

        const stock = await Stocks.findById(id);

        if (!stock) {
            return res.status(404).json({
                message: "Stock not found"
            });
        }

        // ---------------------------------------
        // UNIT VALIDATION
        // ---------------------------------------

        if (stock.unit === "Count") {

            // Count does not allow decimals
            if (!Number.isInteger(quantity)) {
                return res.status(400).json({
                    message: "Count quantity must be a whole number"
                });
            }

        } else if (
            stock.unit === "Meter" ||
            stock.unit === "Gram"
        ) {

            // Meters and Grams allow decimals
            if (!Number.isFinite(quantity)) {
                return res.status(400).json({
                    message: "Invalid quantity"
                });
            }

        } else {

            return res.status(400).json({
                message: "Invalid unit"
            });
        }

        // ---------------------------------------
        // CALCULATE NEW STOCK
        // ---------------------------------------

        const newQuantity = stock.quantity + quantity;

        console.log("Old Quantity:", stock.quantity);
        console.log("Entered Quantity:", quantity);
        console.log("New Quantity:", newQuantity);

        // Stock cannot become negative
        if (newQuantity < 0) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        // ---------------------------------------
        // UPDATE STOCK
        // ---------------------------------------

        stock.quantity = newQuantity;

        await stock.save();

        // ---------------------------------------
        // TRANSACTION TYPE
        // ---------------------------------------

        const transactionType =
            quantity < 0
                ? "Product Purchased"
                : "Stock Added";

        // ---------------------------------------
        // DATE AND TIME
        // ---------------------------------------

        const now = new Date();

        const transactionDate = now.toLocaleDateString("en-IN");
        const transactionTime = now.toLocaleTimeString("en-IN");

        // ---------------------------------------
        // ADD TRANSACTION TO HISTORY
        // ---------------------------------------

        const history = new History({
            productId: stock._id,
            productName: stock.productname,
            transactionDate,
            transactionTime,
            transactionType,
            quantity: Math.abs(quantity),
            price: stock.price * Math.abs(quantity)
        });

        await history.save();

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            message: "Stock updated successfully",
            stock
        });

    } catch (error) {

        console.error("Purchase Stock Error:", error);

        return res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
};




//Delete Stock

exports.deleteStock = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the product
        const deletepro = await Stocks.findByIdAndDelete(id);

        // Check if product exists
        if (!deletepro) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Get current date and time
        const now = new Date();

        const transactionDate = now.toLocaleDateString("en-IN");
        const transactionTime = now.toLocaleTimeString("en-IN");

        // Add deleted product to history
        const history = new History({
            productId: deletepro._id,
            productName: deletepro.productname,
            transactionDate,
            transactionTime,
            transactionType: "Product Deleted",
            quantity: deletepro.quantity,
            price: deletepro.quantity * deletepro.price,
        });

        await history.save();

        return res.status(200).json({
            message: "Product Deleted Successfully",
            deletepro
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


//-------------------------------------Get History-----------------------------------------------

exports.getHistory = async (req, res) => {
    try {
        const history = await History.find()
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json({
            message: "History fetched successfully",
            history
        });

    } catch (error) {
        console.log("Get History Error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// -------------------------------------Get All History-----------------------------------------------

exports.getAllHistory = async (req, res) => {
    try {
        const history = await History.find().sort({ createdAt: -1 });

        return res.status(200).json({
            message: "All history fetched successfully",
            history,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch history",
            error: error.message,
        });
    }
};