// server.js

const THREAD_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

require('dotenv').config();
const express = require('express');
const cors = require('cors');

import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const cron = require('node-cron');

// OpenAI configuration
const openai = new OpenAI( {
    apiKey: process.env.OPENAI_API_KEY,
});

// Assistant ID
const assistantId = 'asst_YNByKfetpGD0xBjXWvxB7fK1';

// In-memory storage for session and thread mapping (could be replaced with a database)
const sessionThreads = {};

// Route for handling assistant messages
app.post('/api/message', async (req, res) => {
  const { sessionId, messages } = req.body;

  // When sending a new message to the assistant, update the last interaction time
  sessionThreads[sessionId].lastInteraction = Date.now();

  try {
    let threadId;

    // Check if there's already a thread for this session
    if (sessionThreads[sessionId]) {
      threadId = sessionThreads[sessionId];
    } else {
      // If not, create a new thread and store it
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      sessionThreads[sessionId] = threadId;
    }

     // Send the messages to the existing or new thread
     for (const message of messages) {
      await openai.beta.threads.messages.create(threadId, {
        role: message.role,
        content: message.content,
      });
    }

    // Create a new run with the specific assistant ID
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Wait for the run to complete
    let runStatus = run.status;
    let actualRun = run;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
      actualRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      runStatus = actualRun.status;
    }

    if (runStatus === 'completed') {
      // Retrieve the assistant's response
      const messagesResponse = await openai.beta.threads.messages.list(threadId, {
        order: 'asc',
      });

      // Find the assistant's last message
      const assistantMessages = messagesResponse.data.filter(
        (msg) => msg.role === 'assistant'
      );
      const assistantMessage = assistantMessages[assistantMessages.length - 1];

      // Extract the content
      let reply = '';
      for (const contentPart of assistantMessage.content) {
        if (contentPart.type === 'text' && contentPart.text && contentPart.text.value) {
          reply += contentPart.text.value;
        }
      }

      res.json({ reply });
    } else {
      res.status(500).json({ error: `An error occurred during the assistant run. Status: ${runStatus}` });
    }
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the assistant.' });
  }
});

async function deleteOldThread(threadId) {
  try {
    await openai.beta.threads.del(threadId);
    console.log(`Deleted thread: ${threadId}`);
  } catch (error) {
    console.error(`Error deleting thread: ${threadId}`, error);
  }
}

function cleanupExpiredThreads() {
  const currentTime = Date.now();

  Object.keys(sessionThreads).forEach(sessionId => {
    const sessionData = sessionThreads[sessionId];
    if (currentTime - sessionData.lastInteraction > THREAD_EXPIRATION_TIME) {
      console.log(`Cleaning up expired thread for session: ${sessionId}`);
      delete sessionThreads[sessionId]; // Remove expired session from memory
      deleteOldThread(sessionData.threadId); // Delete the thread from OpenAI
    }
  });
}

// Run the cleanup task every 10 minutes
cron.schedule('*/10 * * * *', () => {
  console.log('Running thread cleanup...');
  cleanupExpiredThreads();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
