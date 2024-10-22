<template>
  <div class="login-container">
    <h2>Login to The Great Wizard</h2>
    <input v-model="username" type="text" placeholder="Username" />
    <button @click="login">Login</button>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      username: '',
    };
  },
  methods: {
    login() {
      if (this.username.trim()) {
        localStorage.setItem('username', this.username);
        this.$emit('logged-in');
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

input {
  margin-bottom: 10px;
  padding: 8px;
}

button {
  padding: 8px 16px;
}
</style>
