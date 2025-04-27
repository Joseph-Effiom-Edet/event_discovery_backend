const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

// JWT Secret - in production this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to authenticate a user based on the JWT token
 */
const authMiddleware = async (req, res, next) => {
	try {
		// Get the token from the Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const token = authHeader.split(' ')[1];

		try {
			// Verify the token
			const decoded = jwt.verify(token, JWT_SECRET);

			// Get the user from the database
			const user = await User.getById(decoded.id);

			if (!user) {
				return res.status(401).json({ error: 'User not found' });
			}

			// Attach the user to the request object
			req.user = user;
			next();
		} catch (jwtError) {
			console.error('JWT verification error:', jwtError);
			return res.status(401).json({ error: 'Invalid token' });
		}
	} catch (error) {
		console.error('Auth middleware error:', error);
		res.status(500).json({ error: 'Authentication failed' });
	}
};

module.exports = authMiddleware;
