export const validateChatRequest = (req, res, next) => {
    try {
        if (!req.body || !Array.isArray(req.body.messages)) {
            return res.status(400).json({ success: false, message: 'messages array is required' });
        }
        next();
    } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }
};

export default validateChatRequest;


