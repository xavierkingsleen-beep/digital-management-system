const router = require('express').Router();
const NotificationConfig = require('../models/NotificationConfig');
const { protect, adminOnly } = require('../middleware/auth');

// GET all configs
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const configs = await NotificationConfig.find().sort('name');
    res.json(configs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create config
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, enabled, times, targetRole, message, actionUrl, type } = req.body;
    if (!name || !message || !actionUrl)
      return res.status(400).json({ message: 'name, message, and actionUrl are required' });
    const config = await NotificationConfig.create({ name, enabled, times, targetRole, message, actionUrl, type });
    res.status(201).json(config);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update config
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const config = await NotificationConfig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!config) return res.status(404).json({ message: 'Config not found' });
    res.json(config);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE config
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await NotificationConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
