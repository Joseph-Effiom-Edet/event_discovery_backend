const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models/index');

// JWT Secret - in production this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

const authController = {
	// Register a new user
	async register(req, res) {
		try {
			const { username, email, password, name, avatar_url } = req.body;

			// Validate required fields
			if (!username || !email || !password) {
				return res.status(400).json({ error: 'Username, email, and password are required' });
			}

			// Check if user with the same email already exists
			const existingUser = await User.getByEmail(email);
			if (existingUser) {
				return res.status(400).json({ error: 'User with this email already exists' });
			}

			// Hash the password
			const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

			// Create the user with hashed password
			const userData = {
				username,
				email,
				password: hashedPassword,
				name: name || username,
				avatar_url: avatar_url || null
			};

			const newUser = await User.create(userData);

			// Generate JWT token
			const token = jwt.sign({ id: newUser.id, email: newUser.email, username: newUser.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

			res.status(201).json({
				token,
				user: newUser
			});
		} catch (error) {
			console.error('Error in register:', error);
			res.status(500).json({ error: 'Registration failed' });
		}
	},

	// Login a user
	async login(req, res) {
		try {
			const { email, password } = req.body;

			// Validate required fields
			if (!email || !password) {
				return res.status(400).json({ error: 'Email and password are required' });
			}

			// Find the user by email
			const user = await User.getByEmail(email);

			if (!user) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}

			// Verify password
			const isPasswordValid = await bcrypt.compare(password, user.password);

			if (!isPasswordValid) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}

			// Generate JWT token
			const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

			// Remove password from the user object
			const { password: _, ...userWithoutPassword } = user;

			res.json({
				token,
				user: userWithoutPassword
			});
		} catch (error) {
			console.error('Error in login:', error);
			res.status(500).json({ error: 'Login failed' });
		}
	},

	// Validate a token
	async validateToken(req, res) {
		try {
			const token = req.headers.authorization?.split(' ')[1];

			if (!token) {
				return res.status(401).json({ error: 'No token provided' });
			}

			try {
				// Verify the token
				const decoded = jwt.verify(token, JWT_SECRET);

				// Get the user from the database
				const user = await User.getById(decoded.id);

				if (!user) {
					return res.status(404).json({ error: 'User not found' });
				}

				res.json({
					valid: true,
					user
				});
			} catch (jwtError) {
				return res.status(401).json({ error: 'Invalid token', valid: false });
			}
		} catch (error) {
			console.error('Error in validateToken:', error);
			res.status(500).json({ error: 'Token validation failed' });
		}
	}
};

module.exports = authController;
