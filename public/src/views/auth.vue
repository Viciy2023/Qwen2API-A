<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-10">
    <transition name="fade-slide">
      <div
        class="vc-shell w-full max-w-xl p-8 md:p-10"
        v-if="showPanel">
        <div class="mb-8">
          <div class="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">Qwen2API Admin</div>
          <h1 class="vc-title mt-5">管理员身份验证</h1>
          <p class="vc-subtitle mt-3">输入管理员 API Key 进入控制台。整个界面已切换为更简洁的控制台风格。</p>
        </div>

        <div class="space-y-4">
          <input type="text"
            class="vc-input h-14"
            placeholder="请输入管理员账号"
            v-model="apiKey"
            @keyup.enter="handleLogin">
          <button class="vc-button-primary h-14 w-full rounded-2xl text-base"
            @click="handleLogin">登录</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const apiKey = ref('')
const showPanel = ref(false)

const handleLogin = async () => {
  try {
    const res = await axios.post('/verify', {
      apiKey: apiKey.value
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (res.data.status == 200) {     
      localStorage.setItem('apiKey', apiKey.value)
      router.push({ path: '/', replace: true })
    } else {
      alert('apiKey 校验失败,请重新输入!')
    }
  } catch (err) {
    alert('apiKey 校验失败,请重新输入!')
  }
}

onMounted(() => {
  setTimeout(() => {
    showPanel.value = true
  }, 80)
})
</script>

<style lang="css" scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
.fade-slide-enter-to, .fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
