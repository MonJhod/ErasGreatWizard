<template>
  <div id="app">
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- Sidebar content -->
      <button @click="toggleSidebar">Toggle Sidebar</button>
    </div>
    <div class="main-content">
      <h1 class="title">The Great Wizard</h1>
      <login v-if="!isLoggedIn" @logged-in="checkLogin" />
      <div v-else class="chat-container">
        <div class="chat-box">
          <div v-for="(message, index) in messages" :key="index" :class="message.role">
            <p>{{ message.content }}</p>
          </div>
        </div>
        <div class="input-area">
          <input v-model="userMessage" @keyup.enter="sendMessage" type="text" placeholder="Speak to the wizard..." />
          <button @click="sendMessage">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Login from './components/Login.vue';

export default {
  name: 'App',
  components: {
    Login,
  },
  data() {
    return {
      isLoggedIn: false,
      userMessage: '',
      messages: [],
      isSidebarCollapsed: false,
    };
  },
  created() {
    this.checkLogin();
  },
  methods: {
    checkLogin() {
      this.isLoggedIn = !!localStorage.getItem('username');
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    async sendMessage() {
      if (this.userMessage.trim()) {
        // Add user's message to chat
        this.messages.push({ role: 'user', content: this.userMessage });

        try {
          // Send message to the backend
          const response = await axios.post('http://localhost:5000/api/message', {
            messages: this.messages,
          });

          // Add assistant's reply to chat
          this.messages.push({ role: 'assistant', content: response.data.reply });
        } catch (error) {
          console.error('Error communicating with the server:', error);
          this.messages.push({ role: 'assistant', content: 'An error occurred. Please try again later.' });
        }

        // Clear the input
        this.userMessage = '';
      }
    },
  },
};
</script>

<style>
/* Global styles */
#app {
  display: flex;
}

/* Sidebar styles */
.sidebar {
  width: 200px;
  background-color: #2e2b23;
  color: #fff;
  padding: 10px;
  transition: width 0.3s;
}

.sidebar.collapsed {
  width: 0;
  padding: 0;
  overflow: hidden;
}

/* Main content styles */
.main-content {
  flex: 1;
  padding: 20px;
  background-color: #3b3a32;
  color: #e0e0e0;
}

.title {
  text-align: center;
  font-family: 'Uncial Antiqua', cursive;
  color: #9acd32;
}

/* Chat styles */
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
}

.chat-box {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #2e2b23;
  margin-bottom: 10px;
}

.user {
  text-align: right;
  margin-bottom: 10px;
}

.assistant {
  text-align: left;
  margin-bottom: 10px;
}

.input-area {
  display: flex;
}

input[type='text'] {
  flex: 1;
  padding: 10px;
  border: none;
}

button {
  padding: 10px;
  background-color: #556b2f;
  color: #fff;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #6b8e23;
}
</style>
