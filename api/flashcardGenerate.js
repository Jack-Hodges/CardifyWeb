import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { count, topic } = req.body;
        
        const prompt = `Generate exactly ${count} flashcards about ${topic}. 
Format each flashcard as a question and answer pair, with each pair on a new line.
Do not include any additional text, just the questions and answers.
Example format:
What is photosynthesis?|The process by which plants convert light energy into chemical energy
What is the capital of France?|Paris

Make sure that you ONLY generate ${count} flashcards.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        res.status(200).send(response.choices[0].message.content);
    } catch (error) {
        console.error("Error generating flashcards:", error);
        res.status(500).json({ error: error.message });
    }
} 