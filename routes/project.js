const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");

// protect this route
router.post("/", authenticate, async (req, res) => {
  // create project logic here
});

router.get("/", authenticate, async (req, res) => {
  // get all projects logic here
});

module.exports = router;
