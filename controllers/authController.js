const User = require('../models/user');

exports.signup = async (req, res) => {
  try {
    const { email, whatsappNumber } = req.body;

    if (!email || !whatsappNumber) {
      return res.status(400).json({ message: 'Email and WhatsApp number are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { whatsappNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or WhatsApp number already exists' });
    }

    const user = new User({
      email,
      whatsappNumber,
      category: null,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, whatsappNumber } = req.body;

    if (!email || !whatsappNumber) {
      return res.status(400).json({ message: 'Email and WhatsApp number are required' });
    }

    let user;
    user = await User.findOne({ email, whatsappNumber });
    if (!user) {
      user = new User({
      email,
      whatsappNumber,
      category: null,
    });

    await user.save();
    }

    res.status(200).json({ message: 'Login successful', userId: user._id, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
