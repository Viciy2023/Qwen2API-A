<template>
    <div class="w-full min-h-screen p-4 md:p-6">
        <div class="container mx-auto max-w-7xl">
            <div class="flex flex-col md:flex-row justify-between items-center mb-8 px-2 space-y-4 md:space-y-0 pt-5">
                <div>
                    <h1 class="vc-title">系统设置</h1>
                    <p class="vc-subtitle mt-2">统一管理 API Key、自动刷新与模型显示策略。</p>
                </div>
                <router-link to="/"
                    class="vc-button-secondary">
                    返回Token管理
                </router-link>
            </div>
            <div class="grid grid-cols-1 gap-6 p-2">
                <!-- API Key 管理 -->
                <div class="vc-panel relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4">
                    <div class="relative flex flex-col gap-4">
                        <label class="text-slate-800 font-semibold text-lg">API Key 管理</label>

                        <!-- 管理员密钥 -->
                        <div class="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-yellow-600 font-semibold">👑 管理员密钥</span>
                                <span class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">不可修改</span>
                            </div>
                            <input :value="settings.adminKey" type="text" readonly class="vc-input h-11 cursor-not-allowed bg-white/80">
                        </div>

                        <!-- 普通密钥列表 -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-700 font-semibold">🔐 普通密钥</span>
                                <button @click="showAddKeyModal = true" class="vc-button-primary px-3 py-2 text-sm rounded-xl">
                                    + 添加密钥
                                </button>
                            </div>

                            <div v-if="settings.regularKeys.length === 0" class="text-gray-500 text-center py-4">
                                暂无普通密钥
                            </div>

                            <div v-for="(key, index) in settings.regularKeys" :key="index" class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <input :value="key" type="text" readonly class="vc-input h-10 flex-1 bg-white/90">
                                <button @click="deleteRegularKey(index)" class="vc-button border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100">
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 其他设置项 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- 自动刷新 -->
                    <div class="vc-panel relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4">
                        <div class="relative flex flex-col gap-2">
                            <label class="text-slate-800 font-semibold">自动刷新</label>
                            <div class="flex items-center gap-2">
                                <input v-model="settings.autoRefresh" type="checkbox"
                                    class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                                <span>启用自动刷新</span>
                            </div>
                            <label class="text-gray-700">刷新间隔（秒）</label>
                            <input v-model.number="settings.autoRefreshInterval" type="number" class="vc-input mt-1 h-12">
                            <button @click="saveAutoRefresh" class="vc-button-primary w-full mt-2">保存</button>
                        </div>
                    </div>
                    <!-- 思考输出 -->
                    <div class="vc-panel relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4">
                        <div class="relative flex flex-col gap-2">
                            <label class="text-slate-800 font-semibold">思考输出</label>
                            <div class="flex items-center gap-2">
                                <input v-model="settings.outThink" type="checkbox"
                                    class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                                <span>启用思考输出</span>
                            </div>
                            <button @click="saveOutThink" class="vc-button-primary w-full mt-2">保存</button>
                        </div>
                    </div>
                    <!-- 搜索信息模式 -->
                    <div class="vc-panel relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4">
                        <div class="relative flex flex-col gap-2">
                            <label class="text-slate-800 font-semibold">搜索信息显示模式</label>
                            <select v-model="settings.searchInfoMode" class="vc-input mt-1 h-12">
                                <option value="table">表格模式</option>
                                <option value="text">文本模式</option>
                            </select>
                            <button @click="saveSearchInfoMode" class="vc-button-primary w-full mt-2">保存</button>
                        </div>
                    </div>
                    <!-- 简化模型映射 -->
                    <div class="vc-panel relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4">
                        <div class="relative flex flex-col gap-2">
                            <label class="text-slate-800 font-semibold">简化模型映射</label>
                            <div class="flex items-center gap-2">
                                <input v-model="settings.simpleModelMap" type="checkbox"
                                    class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                                <span>只返回基础模型，不包含thinking、search、image等变体</span>
                            </div>
                            <button @click="saveSimpleModelMap" class="vc-button-primary w-full mt-2">保存</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 添加API Key模态框 -->
            <div v-if="showAddKeyModal"
                class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="vc-shell w-96 max-w-[90vw] p-6">
                    <h3 class="text-lg font-semibold mb-4">添加普通API Key</h3>
                    <input v-model="newApiKey" type="text" placeholder="请输入API Key" class="vc-input mb-4 h-11">
                    <div class="flex gap-2 justify-end">
                        <button @click="showAddKeyModal = false" class="vc-button-secondary">
                            取消
                        </button>
                        <button @click="addRegularKey" class="vc-button-primary">
                            添加
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const settings = ref({
    apiKey: localStorage.getItem('apiKey'),
    adminKey: '',
    regularKeys: [],
    defaultHeaders: '',
    defaultCookie: '',
    autoRefresh: false,
    autoRefreshInterval: 21600,
    outThink: false,
    searchInfoMode: 'table',
    simpleModelMap: false
})

const showAddKeyModal = ref(false)
const newApiKey = ref('')

const loadSettings = async () => {
    try {
        const res = await axios.get('/api/settings', {
            headers: {
                'Authorization': localStorage.getItem('apiKey')
            }
        })
        settings.value.apiKey = res.data.apiKey
        settings.value.adminKey = res.data.adminKey || ''
        settings.value.regularKeys = res.data.regularKeys || []
        settings.value.defaultHeaders = JSON.stringify(res.data.defaultHeaders)
        settings.value.defaultCookie = res.data.defaultCookie
        settings.value.autoRefresh = res.data.autoRefresh
        settings.value.autoRefreshInterval = res.data.autoRefreshInterval
        settings.value.outThink = res.data.outThink
        settings.value.searchInfoMode = res.data.searchInfoMode
        settings.value.simpleModelMap = res.data.simpleModelMap
    } catch (error) {
        console.error('加载设置失败:', error)
    }
}

const saveApiKey = async () => {
    try {
        await axios.post('/api/setApiKey', { apiKey: settings.value.apiKey }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('API Key保存成功')
    } catch (error) {
        alert('API Key保存失败: ' + error.message)
    }
}
const saveAutoRefresh = async () => {
    try {
        await axios.post('/api/setAutoRefresh', {
            autoRefresh: settings.value.autoRefresh,
            autoRefreshInterval: settings.value.autoRefreshInterval
        }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('自动刷新设置保存成功')
    } catch (error) {
        alert('自动刷新设置保存失败: ' + error.message)
    }
}
const saveOutThink = async () => {
    try {
        await axios.post('/api/setOutThink', { outThink: settings.value.outThink }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('思考输出设置保存成功')
    } catch (error) {
        alert('思考输出设置保存失败: ' + error.message)
    }
}
const saveSearchInfoMode = async () => {
    try {
        await axios.post('/api/search-info-mode', { searchInfoMode: settings.value.searchInfoMode }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('搜索信息模式保存成功')
    } catch (error) {
        alert('搜索信息模式保存失败: ' + error.message)
    }
}
const saveSimpleModelMap = async () => {
    try {
        await axios.post('/api/simple-model-map', { simpleModelMap: settings.value.simpleModelMap }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('简化模型映射设置保存成功')
    } catch (error) {
        alert('简化模型映射设置保存失败: ' + error.message)
    }
}

// API Key 管理相关函数
const addRegularKey = async () => {
    if (!newApiKey.value.trim()) {
        alert('请输入API Key')
        return
    }

    try {
        await axios.post('/api/addRegularKey', { apiKey: newApiKey.value.trim() }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('API Key添加成功')
        newApiKey.value = ''
        showAddKeyModal.value = false
        await loadSettings()
    } catch (error) {
        alert('API Key添加失败: ' + error.message)
    }
}

const deleteRegularKey = async (index) => {
    if (!confirm('确定要删除此API Key吗？')) return

    const keyToDelete = settings.value.regularKeys[index]
    try {
        await axios.post('/api/deleteRegularKey', { apiKey: keyToDelete }, {
            headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
        })
        alert('API Key删除成功')
        await loadSettings()
    } catch (error) {
        alert('API Key删除失败: ' + error.message)
    }
}

onMounted(() => {
    loadSettings()
})
</script>

<style lang="css" scoped>
</style>
