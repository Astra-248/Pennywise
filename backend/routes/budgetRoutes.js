
const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");

// GET: Get the budget for a particular month
router.get("/", async (req, res) => {
    try {
        const month = req.query.month;

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                message: "A valid month is required (YYYY-MM)."
            });
        }

        const budget = await Budget.findOne({ month });

        res.json(budget || { month, amount: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: Create or update the budget for a month
router.put("/", async (req, res) => {
    try {
        const { month, amount } = req.body;
        const numericAmount = Number(amount);

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                message: "A valid month is required (YYYY-MM)."
            });
        }

        if (
            amount === "" ||
            amount === null ||
            amount === undefined ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                message: "Budget must be greater than zero."
            });
        }

        const budget = await Budget.findOneAndUpdate(
            { month },
            { month, amount: numericAmount },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
