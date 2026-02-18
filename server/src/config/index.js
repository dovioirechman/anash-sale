import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
  admin: {
    password: process.env.ADMIN_PASSWORD,
  },
};
