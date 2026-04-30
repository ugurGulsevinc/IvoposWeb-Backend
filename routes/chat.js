const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { status } = req.query;
  let msgs = db.get('chatMessages').value();
  if (status) msgs = msgs.filter((m) => m.status === status);
  msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(msgs);
});

router.get('/stats', auth, (_req, res) => {
  const all = db.get('chatMessages').value();
  res.json({
    total: all.length,
    new: all.filter((m) => m.status === 'new').length,
    read: all.filter((m) => m.status === 'read').length,
    replied: all.filter((m) => m.status === 'replied').length
  });
});

router.post('/send', (req, res) => {
  const { visitorName, visitorEmail, message, sessionId } = req.body;
  if (!visitorName || !message) return res.status(400).json({ error: 'visitorName ve message gerekli' });
  const msg = {
    id: uuidv4(),
    sessionId: sessionId || uuidv4(),
    visitorName, visitorEmail: visitorEmail || '',
    message, reply: '', status: 'new',
    createdAt: new Date().toISOString(), repliedAt: null
  };
  db.get('chatMessages').push(msg).write();
  res.json({ success: true, id: msg.id, sessionId: msg.sessionId });
});

router.put('/:id/read', auth, (req, res) => {
  const msg = db.get('chatMessages').find({ id: req.params.id });
  if (!msg.value()) return res.status(404).json({ error: 'Mesaj bulunamadı' });
  if (msg.value().status === 'new') msg.assign({ status: 'read' }).write();
  res.json({ success: true });
});

router.put('/:id/reply', auth, (req, res) => {
  const { reply } = req.body;
  const msg = db.get('chatMessages').find({ id: req.params.id });
  if (!msg.value()) return res.status(404).json({ error: 'Mesaj bulunamadı' });
  msg.assign({ reply, status: 'replied', repliedAt: new Date().toISOString() }).write();
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.get('chatMessages').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

module.exports = router;
