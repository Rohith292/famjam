// backend/routes/analyticsRoutes.js

import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { handleChatQuery } from '../controllers/analytics.controller.js';

const router = express.Router();

// Route to handle chat queries
// We protect this route to ensure only logged-in users can access the chatbot
router.post('/chat', protectRoute, handleChatQuery);

export default router;