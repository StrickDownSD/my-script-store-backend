exports.chat = async (req, res) => {
    try {
        const { message } = req.body;

        // Mock AI Logic for Demo because we don't have a real Gemini Key in this environment
        let reply = "I am the AI Assistant. ";

        if (message.toLowerCase().includes('script')) {
            reply += "I recommend the 'Auto-Facebook-Tool' script. It is our best seller!";
        } else if (message.toLowerCase().includes('price')) {
            reply += "Our scripts range from $10 to $50. Check the scripts page for details.";
        } else {
            reply += "How can I help you with your Termux scripts today?";
        }

        // Simulate network delay
        setTimeout(() => {
            res.json({ reply });
        }, 1000);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
