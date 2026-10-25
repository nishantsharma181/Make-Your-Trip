const express=require("express");
const router=express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");
const {saveRedirectUrl, isLoggedIn}=require ("../middleware.js");
const usercontroller=require("../controllers/users.js");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
 router.get("/", (req, res) => {
    res.redirect("/listings");
});
router.get("/signup", usercontroller.renderSignup);



router.post(
  "/signup",
  wrapAsync(usercontroller.Signup)
);
router.get("/login", usercontroller.renderLogin);

router.post("/login", saveRedirectUrl, passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
}), usercontroller.Login);
router.get("/logout", usercontroller.Logout);
router.get(
    "/profile",
    isLoggedIn,
    saveRedirectUrl,
    wrapAsync(usercontroller.profile)
);router.get(
  "/profile/edit",
  isLoggedIn,
  wrapAsync(usercontroller.renderEditProfile)
);

router.put(
  "/profile",
  isLoggedIn,
  upload.single("image"),
  wrapAsync(usercontroller.updateProfile)
);
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome Back!");
    res.redirect("/listings");
  }
);
module.exports=router;
