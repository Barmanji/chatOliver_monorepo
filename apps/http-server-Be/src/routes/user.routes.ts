import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture,
    updateUserBio,
    getUserProfile,
    getAnyUserFriendList,
    getMyFriendsList
} from "../controllers/user.controller.js";


const router = express.Router();

// Public routes
router.route("/register").post(
    //injecting middleware!! for file handling
    upload.fields([
        {
            name: "profilePicture", maxCount: 1
        },
    ]),
    registerUser
)
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/get-any-user-friend-list/c/:username").get(getAnyUserFriendList);
router.route("/c/:username").get(getUserProfile);

// Protected routes
router.use(verifyJWT); // applied to all routes below this line COOL AF

router.route("/logout").post(logoutUser);
router.route("/current-user").get(getCurrentUser);
router.route("/change-password").put(changeCurrentPassword);
router.route("/update-account").put(updateAccountDetails);
router.route("/update-profile-picture").put(upload.single("profilePicture"), updateUserProfilePicture);
router.route("/update-bio").put(updateUserBio);
router.route("/get-my-friend-list").get(getMyFriendsList);

export default router;

