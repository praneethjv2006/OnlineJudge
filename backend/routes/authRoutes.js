const express = require("express");
const registerController = require("../controllers/auth/registerController");
const loginController = require("../controllers/auth/loginController");
const refreshController = require("../controllers/auth/refreshController");
const logoutController = require("../controllers/auth/logoutController");
const meController = require("../controllers/auth/meController");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/me", meController);

module.exports = router;