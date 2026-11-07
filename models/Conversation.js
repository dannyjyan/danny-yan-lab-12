const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    evidence: mongoose.Schema.Types.Mixed,
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    _id: String,
    messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
