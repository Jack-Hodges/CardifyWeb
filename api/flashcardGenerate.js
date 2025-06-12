import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { count, topic } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        console.log('Generating flashcards:', { count, topic });
        
        const prompt = `Generate exactly ${count} flashcards about ${topic}. 
Format each flashcard as a question and answer pair, with each pair on a new line.
Do not include any additional text, just the questions and answers.
Example format:
What is photosynthesis?|The process by which plants convert light energy into chemical energy
What is the capital of France?|Paris

Make sure that you ONLY generate ${count} flashcards.`;

        console.log('Sending request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "user", content: prompt }
            ]
        });
        console.log('Received response from OpenAI');

        res.status(200).send(response.choices[0].message.content);
    } catch (error) {
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            apiKey: process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
        });
        res.status(500).json({ 
            error: error.message,
            details: 'Check Vercel logs for more information'
        });
    }
} 