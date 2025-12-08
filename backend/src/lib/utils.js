   

// Assuming generateToken is in ../lib/utils.js and looks something like this:
 import jwt from 'jsonwebtoken';
 export const generateToken = (userId, res) => {
     const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15d', // Or whatever your expiration is
   });
   res.cookie("jwt", token, {
       maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in ms
httpOnly: true, // Prevents XSS attacks
       sameSite: "strict", // CSRF protection
       secure: process.env.NODE_ENV !== "development", // Use secure cookies in production (HTTPS)
   });
   return token; // <--- MAKE SURE generateToken RETURNS THE TOKEN STRING!
};

    