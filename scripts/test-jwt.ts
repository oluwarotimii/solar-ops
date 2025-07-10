const { generateToken, verifyToken } = require("../lib/auth");

const testJwt = async () => {
  const userId = "test-user-id";
  const token = generateToken(userId);
  console.log("Generated Token:", token);

  const decoded = verifyToken(token);
  console.log("Decoded Token:", decoded);

  if (decoded && decoded.userId === userId) {
    console.log("JWT verification successful!");
  } else {
    console.log("JWT verification failed.");
  }
};

testJwt();