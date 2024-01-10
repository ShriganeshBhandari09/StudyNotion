const User = require("../models/User");
const OTP = require("../models/OTP");
const OTPGenerator = require("otp-generator");
const bcrypt = require("bcrypt")

//sendOTP
exports.sendOTP = async (req, res) => {
  try {
    //fetch email from request body
    const { email } = req.body;

    //check if user already exist
    const checkUserPresent = await User.findOne({ email });

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User Already Registered",
      });
    }

    var otp = OTPGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("OTP generated:", otp);

    //check unique otp or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = OTPGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    //create an entry for OTP
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    res.status(200).json({
      success: true,
      message: "Otp sent successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      messgae: error.message,
    });
  }
};

//signUp
exports.signUp = async (req, res) => {
  try {
    //data fetch from request body

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      contactNumber,
      accountType,
      otp,
    } = req.body;
    //validate the data
    if (
      !firstName ||
      !lastName ||
      !password ||
      !email ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    //2 password match karlo
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password does not match",
      });
    }
    //check user already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Already Exist",
      });
    }

    //find most recent otp stored for user

    const recentOtp = await OTP.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);
    //validate OTP
    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Otp not found",
      });
    } else if (otp !== recentOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //entry created in DB
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebar.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return res

    return res.status(200).json({
      success: true,
      message: "User is registered Successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot registered please try again",
    });
  }
};

//LoginIn

//changePassword
