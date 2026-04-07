const router = require('express').Router();
const MessMenu = require('../models/MessMenu');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const menu = await MessMenu.find();
    res.json(menu);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { day } = req.body;
    const existing = await MessMenu.findOne({ day });
    if (existing) {
      const updated = await MessMenu.findOneAndUpdate({ day }, req.body, { new: true });
      return res.json(updated);
    }
    const item = await MessMenu.create(req.body);
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
