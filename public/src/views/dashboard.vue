<template>
  <div class="w-100vw h-100vh p-4 overflow-y-auto">
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-4 space-y-4 md:space-y-0 pt-5">
        <h1 class="text-4xl font-bold">Token Manager <span class="text-gray-500 text-sm">by 兜豆子</span></h1>
        <div class="grid grid-cols-2 sm:flex sm:flex-row w-full md:w-auto gap-2 sm:gap-0 sm:space-x-2 lg:space-x-4">
          <button @click="showAddModal = true"
                  class="action-button font-bold border border-green-200 bg-green-50 text-green-900 px-4 py-2 rounded-xl shadow-sm hover:bg-green-100 hover:border-green-400 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-center">
            添加账号
          </button>
          <button @click="refreshAllAccounts"
                  :disabled="isRefreshingAll"
                  :class="[
                    'action-button font-bold px-4 py-2 rounded-xl shadow-sm transition-all duration-300 transform active:translate-y-0',
                    isRefreshingAll
                      ? 'bg-purple-400 text-white border-purple-400 refreshing-button-purple cursor-not-allowed transform-none'
                      : 'macaron-purple-button text-purple-800 hover:-translate-y-1'
                  ]">
            <span v-if="isRefreshingAll" class="flex items-center space-x-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>刷新中...</span>
            </span>
            <span v-else>一键刷新</span>
          </button>
          <button @click="forceRefreshAllAccounts"
                  :disabled="isForceRefreshingAll"
                  :class="[
                    'action-button font-bold px-4 py-2 rounded-xl shadow-sm transition-all duration-300 transform active:translate-y-0',
                    isForceRefreshingAll
                      ? 'bg-pink-400 text-white border-pink-400 refreshing-button-pink cursor-not-allowed transform-none'
                      : 'macaron-pink-button text-pink-800 hover:-translate-y-1'
                  ]">
            <span v-if="isForceRefreshingAll" class="flex items-center space-x-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>强制刷新中...</span>
            </span>
            <span v-else>强制刷新</span>
          </button>
          <button @click="exportAccounts"
                  class="action-button font-bold border border-yellow-200 bg-yellow-50 text-yellow-900 px-4 py-2 rounded-xl shadow-sm hover:bg-yellow-100 hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-center">
            导出账号
          </button>
          <button @click="openModelsPanel"
                  class="action-button font-bold border border-violet-200 bg-violet-50 text-violet-900 px-4 py-2 rounded-xl shadow-sm hover:bg-violet-100 hover:border-violet-400 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-center">
            可用模型
          </button>
          <router-link to="/settings"
                        class="action-button col-span-2 sm:col-span-1 font-bold border border-blue-200 bg-blue-50 text-blue-900 px-4 py-2 rounded-xl shadow-sm hover:bg-blue-100 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-center">
            系统设置
          </router-link>
        </div>
      </div>

      <!-- 分页控制区 -->
      <div class="flex justify-between items-center px-4 mb-4">
        <div class="flex items-center space-x-2">
          <span class="text-gray-700">每页显示:</span>
          <select v-model="pageSize" @change="changePageSize" class="rounded-lg border-gray-300 bg-white/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
        </div>
        <div class="flex space-x-2 items-center">
          <span class="text-gray-700">共 {{ totalItems }} 项</span>
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1" 
            :class="[
              'px-3 py-1 rounded-lg transition-all duration-300', 
              currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            ]"
          >
            上一页
          </button>
          <span class="text-gray-700">{{ currentPage }}/{{ totalPages }}</span>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages || totalPages === 0" 
            :class="[
              'px-3 py-1 rounded-lg transition-all duration-300', 
              currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            ]"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 多选操作区 -->
      <div class="flex justify-between items-center px-4 mb-4">
        <div class="flex items-center space-x-3">
          <label class="inline-flex items-center cursor-pointer group">
            <div class="relative">
              <input type="checkbox" 
                    v-model="selectAll" 
                    @change="toggleSelectAll" 
                    class="sr-only peer">
              <div class="w-6 h-6 bg-white border-2 border-gray-300 rounded-lg peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-300 flex items-center justify-center">
                <svg v-show="selectAll" class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <span class="ml-2 text-gray-700 group-hover:text-indigo-700 transition-colors duration-200">全选</span>
          </label>
          <button 
            @click="deleteSelected" 
            :disabled="selectedTokens.length === 0" 
            :class="[
              'px-4 py-1.5 rounded-lg transition-all duration-300 border flex items-center space-x-1', 
              selectedTokens.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>删除选中 ({{ selectedTokens.length }})</span>
          </button>
        </div>
        <button 
          @click="showDeleteAllConfirm = true" 
          class="px-4 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-300 flex items-center space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>删除全部账号</span>
        </button>
      </div>

      <!-- Token列表 -->
      <div class="max-h-[calc(75vh)] overflow-y-auto pr-2 scrollbar-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          <div v-for="token in displayedTokens" 
               :key="token.email" 
               class="token-card group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl pt-4"
               :class="{'ring-2 ring-indigo-500 ring-opacity-75': isSelected(token.email)}">
            <div class="absolute top-3 left-3 z-10">
              <label class="custom-checkbox cursor-pointer">
                <input type="checkbox" 
                       :checked="isSelected(token.email)" 
                       @change="toggleSelect(token.email)"
                       class="sr-only peer">
                <div class="checkbox-icon w-6 h-6 bg-white/70 backdrop-blur-sm border-2 border-gray-300 rounded-lg peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow">
                  <svg v-show="isSelected(token.email)" class="w-4 h-4 text-white transform scale-0 peer-checked:scale-100 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </label>
            </div>
            <div class="absolute inset-0 bg-white/30 backdrop-blur-md border border-white/30"></div>
            <div class="relative p-6 flex flex-col gap-4">
              <div class="flex flex-col space-y-3">
                <div class="relative flex items-center bg-blue-50/80 rounded-lg px-2 py-1">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-gray-700 min-w-[96px] text-left font-semibold">📧 Email:</span>
                    <span class="font-medium whitespace-nowrap text-left">{{ token.email }}</span>
                  </div>
                  <button @click="copyToClipboard(token.email)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity bg-blue-200 hover:bg-blue-300 rounded px-2 py-1 text-base">📋</button>
                </div>
                <div class="relative flex items-center bg-blue-50/80 rounded-lg px-2 py-1">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-gray-700 min-w-[96px] text-left font-semibold">🔑 Passwd:</span>
                    <span class="font-medium whitespace-nowrap text-left">{{ token.password }}</span>
                  </div>
                  <button @click="copyToClipboard(token.password)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity bg-blue-200 hover:bg-blue-300 rounded px-2 py-1 text-base">📋</button>
                </div>
                <div class="relative flex items-center bg-blue-50/80 rounded-lg px-2 py-1">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-gray-700 min-w-[96px] text-left font-semibold">🔐 Token:</span>
                    <span class="font-medium whitespace-nowrap text-left text-sm">{{ token.token }}</span>
                  </div>
                  <button @click="copyToClipboard(token.token)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity bg-blue-200 hover:bg-blue-300 rounded px-2 py-1 text-base">📋</button>
                </div>
                <div class="relative flex items-center bg-blue-50/80 rounded-lg px-2 py-1">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-gray-700 min-w-[96px] text-left font-semibold">⏰ Expire:</span>
                    <span class="font-medium whitespace-nowrap text-left">{{ new Date(token.expires * 1000).toLocaleString() }}</span>
                  </div>
                  <button @click="copyToClipboard(new Date(token.expires * 1000).toLocaleString())" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity bg-blue-200 hover:bg-blue-300 rounded px-2 py-1 text-base">📋</button>
                </div>
              </div>
              
              <div class="pt-4 mt-auto border-t border-gray-200/50 space-y-2">
                <button @click="refreshToken(token.email)"
                        :disabled="refreshingTokens.includes(token.email)"
                        :class="[
                          'w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2',
                          refreshingTokens.includes(token.email)
                            ? 'bg-green-400 text-white refreshing-button-green cursor-not-allowed'
                            : 'macaron-green-button text-green-600 hover:bg-green-100 border border-green-200'
                        ]">
                  <span v-if="refreshingTokens.includes(token.email)" class="flex items-center space-x-2">
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>刷新中...</span>
                  </span>
                  <span v-else>刷新令牌</span>
                </button>
                <button @click="deleteToken(token.email)"
                        class="w-full group-hover:bg-red-50 text-red-600 py-2 rounded-lg transition-all duration-300 hover:bg-red-100">
                  删除账号
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除全部确认对话框 -->
    <div v-if="showDeleteAllConfirm" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         @click.self="showDeleteAllConfirm = false">
      <div class="relative bg-white/90 backdrop-blur-lg rounded-2xl p-6 w-11/12 max-w-md transform transition-all duration-300 scale-100 opacity-100">
        <h2 class="text-2xl font-bold text-red-600 mb-4">⚠️ 危险操作</h2>
        <p class="text-gray-700 mb-6">您确定要删除<span class="font-bold">全部 {{ totalItems }} 个</span>账号吗？此操作不可恢复！</p>
        <div class="flex justify-end space-x-4">
          <button @click="showDeleteAllConfirm = false" 
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300">
            取消
          </button>
          <button @click="deleteAllAccounts" 
                  class="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-300">
            确认删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加账号模态框 -->
    <div v-if="showAddModal" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         @click.self="showAddModal = false">
      <div class="relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 w-11/12 max-w-md transform transition-all duration-300 scale-100 opacity-100">
        <div class="flex mb-6 border-b border-gray-200">
          <button :class="['flex-1 py-2 font-bold transition-all rounded-t-xl duration-300', addMode==='single' ? 'text-gray-600 border-b-2 border-gray-500 bg-gray-50/60' : 'text-gray-500 bg-transparent']" @click="addMode='single'">单账号添加</button>
          <button :class="['flex-1 py-2 font-bold transition-all rounded-t-xl duration-300', addMode==='batch' ? 'text-gray-600 border-b-2 border-gray-500 bg-gray-50/60' : 'text-gray-500 bg-transparent']" @click="addMode='batch'">批量添加</button>
        </div>
        <transition name="fade" mode="out-in">
          <div v-if="addMode==='single'" key="single">
            <h2 class="text-xl font-bold mb-4">添加账号</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input v-model="newAccount.email" type="email" 
                       class="mt-1 block w-full rounded-xl border-gray-300 bg-white/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 h-12 text-base px-4">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Password</label>
                <input v-model="newAccount.password" type="password" 
                       class="mt-1 block w-full rounded-xl border-gray-300 bg-white/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 h-12 text-base px-4">
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button @click="showAddModal = false" 
                        class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300">
                  取消
                </button>
                <button @click="addToken" 
                        class="px-4 py-2 rounded-xl bg-black text-white hover:bg-white hover:text-black transition-all duration-300">
                  添加
                </button>
              </div>
            </div>
          </div>
          <div v-else key="batch">
            <h2 class="text-xl font-bold mb-4 px-4">批量添加账号</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 px-4 pb-2">账号列表（每行一个，格式：email:password）</label>
                <textarea v-model="batchAccounts" rows="6" class="mt-1 block w-full rounded-xl border-gray-300 bg-white/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 h-36 text-base px-4 py-3 resize-none"></textarea>
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button @click="showAddModal = false" 
                        class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300">
                  取消
                </button>
                <button @click="addBatchTokens" 
                        class="px-4 py-2 rounded-xl bg-black text-white hover:bg-white hover:text-black transition-all duration-300">
                  批量添加
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Toast 通知 -->
    <div v-if="toast.show"
         :class="[
           'fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transform transition-all duration-300',
           toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
         ]">
      <div class="flex items-center space-x-2">
        <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <!-- 可用模型面板 -->
    <div v-if="showModelsPanel"
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         @click.self="showModelsPanel = false">
      <div class="relative bg-white/90 backdrop-blur-lg rounded-2xl p-6 w-11/12 max-w-5xl max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">可用模型</h2>
            <p class="text-sm text-slate-500 mt-1">展示当前实例可直接调用的全部模型</p>
          </div>
          <button @click="showModelsPanel = false"
                  class="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-300">
            关闭
          </button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>共 {{ availableModels.length }} 个模型</span>
            <button @click="setActiveModelFilter('all')"
                    :class="[
                      'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300',
                      activeModelFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    ]">
              全部 {{ availableModels.length }}
            </button>
            <button @click="setActiveModelFilter('base')"
                    :class="getFilterBadgeClass('base', 'bg-slate-100', 'text-slate-600', 'hover:bg-slate-200', 'bg-slate-700')">
              基础 {{ allModelGroups.base.length }}
            </button>
            <button @click="setActiveModelFilter('thinking')"
                    :class="getFilterBadgeClass('thinking', 'bg-amber-100', 'text-amber-700', 'hover:bg-amber-200', 'bg-amber-500')">
              Thinking {{ allModelGroups.thinking.length }}
            </button>
            <button @click="setActiveModelFilter('search')"
                    :class="getFilterBadgeClass('search', 'bg-cyan-100', 'text-cyan-700', 'hover:bg-cyan-200', 'bg-cyan-500')">
              Search {{ allModelGroups.search.length }}
            </button>
            <button @click="setActiveModelFilter('image')"
                    :class="getFilterBadgeClass('image', 'bg-rose-100', 'text-rose-700', 'hover:bg-rose-200', 'bg-rose-500')">
              Image {{ allModelGroups.image.length }}
            </button>
            <button @click="setActiveModelFilter('video')"
                    :class="getFilterBadgeClass('video', 'bg-indigo-100', 'text-indigo-700', 'hover:bg-indigo-200', 'bg-indigo-500')">
              Video {{ allModelGroups.video.length }}
            </button>
            <button @click="setActiveModelFilter('imageEdit')"
                    :class="getFilterBadgeClass('imageEdit', 'bg-emerald-100', 'text-emerald-700', 'hover:bg-emerald-200', 'bg-emerald-500')">
              Image Edit {{ allModelGroups.imageEdit.length }}
            </button>
          </div>
          <div class="flex w-full sm:w-auto gap-2">
            <div class="relative w-full sm:w-72">
              <input v-model="modelKeyword"
                     type="text"
                     placeholder="搜索模型 ID"
                     class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-violet-400 focus:ring-violet-400 transition-all duration-300">
            </div>
            <button @click="refreshModels"
                    :disabled="isLoadingModels"
                    :class="[
                      'rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 border',
                      isLoadingModels
                        ? 'bg-violet-200 text-violet-600 border-violet-200 cursor-not-allowed'
                        : 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
                    ]">
              {{ isLoadingModels ? '刷新中...' : '刷新模型列表' }}
            </button>
          </div>
        </div>

        <div v-if="isLoadingModels" class="py-12 text-center text-slate-500">
          正在加载模型列表...
        </div>

        <div v-else-if="modelsError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-red-600">
          <div class="text-lg font-semibold">模型列表加载失败</div>
          <div class="mt-2 text-sm whitespace-pre-line">{{ modelsError }}</div>
          <button @click="refreshModels"
                  class="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-all duration-300">
            重新加载
          </button>
        </div>

        <div v-else ref="modelsScrollContainer" class="max-h-[60vh] overflow-y-auto pr-2">
          <div class="space-y-5">
            <div v-for="group in groupedModelSections"
                 :key="group.key"
                 v-show="group.models.length"
                 class="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-slate-800">{{ group.title }}</h3>
                  <p class="text-xs text-slate-500 mt-1">{{ group.description }}</p>
                </div>
                <span :class="group.badgeClass" class="rounded-full px-3 py-1 text-xs font-semibold">
                  {{ group.models.length }} 个
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div v-for="model in group.models"
                     :key="model.id"
                     class="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-slate-800 break-all">{{ model.id }}</div>
                      <div class="mt-2 text-xs text-slate-500 break-all">模型名称：{{ getModelDisplayName(model) }}</div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{{ model.owned_by || 'unknown' }}</span>
                        <span v-if="modelTagSummary(model).length"
                              class="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700">
                          {{ modelTagSummary(model).join(' / ') }}
                        </span>
                        <span class="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                          推荐：{{ getModelUseCase(model) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button @click="copyToClipboard(model.id)"
                            class="rounded-lg bg-violet-100 px-2 py-2 text-sm text-violet-700 hover:bg-violet-200 transition-all duration-300">
                      复制 ID
                    </button>
                    <button @click="copyToClipboard(getModelDisplayName(model))"
                            class="rounded-lg bg-sky-100 px-2 py-2 text-sm text-sky-700 hover:bg-sky-200 transition-all duration-300">
                      复制名字
                    </button>
                    <button @click="copyModelRequestExample(model)"
                            class="col-span-2 sm:col-span-1 rounded-lg bg-amber-100 px-2 py-2 text-sm text-amber-700 hover:bg-amber-200 transition-all duration-300">
                      复制示例
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!filteredModelsByCategory.length" class="py-12 text-center text-slate-500">
            没有匹配的模型
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const tokens = ref([])
const showAddModal = ref(false)
const addMode = ref('single')
const newAccount = ref({
  email: '',
  password: ''
})
const batchAccounts = ref('')

// 分页相关
const displayedTokens = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))
const isLoading = ref(false)

// 多选相关
const selectedTokens = ref([])
const selectAll = ref(false)
const showDeleteAllConfirm = ref(false)

// 刷新相关
const isRefreshingAll = ref(false)
const isForceRefreshingAll = ref(false)
const refreshingTokens = ref([])
const showModelsPanel = ref(false)
const availableModels = ref([])
const isLoadingModels = ref(false)
const modelsError = ref('')
const modelKeyword = ref('')
const activeModelFilter = ref('all')
const modelsScrollContainer = ref(null)

// Toast 通知
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const filteredModels = computed(() => {
  const keyword = modelKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return availableModels.value
  }

  return availableModels.value.filter(model =>
    model.id.toLowerCase().includes(keyword)
  )
})

const createModelGroupMap = (models) => {
  const groups = {
    base: [],
    thinking: [],
    search: [],
    image: [],
    video: [],
    imageEdit: []
  }

  models.forEach(model => {
    const id = model.id.toLowerCase()

    if (id.includes('image-edit')) {
      groups.imageEdit.push(model)
    } else if (id.includes('video')) {
      groups.video.push(model)
    } else if (id.includes('image')) {
      groups.image.push(model)
    } else if (id.includes('thinking') && id.includes('search')) {
      groups.thinking.push(model)
      groups.search.push(model)
    } else if (id.includes('thinking')) {
      groups.thinking.push(model)
    } else if (id.includes('search')) {
      groups.search.push(model)
    } else {
      groups.base.push(model)
    }
  })

  return groups
}

const allModelGroups = computed(() => createModelGroupMap(availableModels.value))
const modelGroups = computed(() => createModelGroupMap(filteredModels.value))

const filteredModelsByCategory = computed(() => {
  if (activeModelFilter.value === 'all') {
    return filteredModels.value
  }

  return modelGroups.value[activeModelFilter.value] || []
})

const groupedModelSections = computed(() => [
  {
    key: 'base',
    title: '基础模型',
    description: '适合普通对话、通用推理和默认场景',
    badgeClass: 'bg-slate-100 text-slate-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'base' ? modelGroups.value.base : []
  },
  {
    key: 'thinking',
    title: 'Thinking 模型',
    description: '带推理输出能力，适合复杂思考场景',
    badgeClass: 'bg-amber-100 text-amber-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'thinking' ? modelGroups.value.thinking : []
  },
  {
    key: 'search',
    title: 'Search 模型',
    description: '带搜索能力，适合联网或检索场景',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'search' ? modelGroups.value.search : []
  },
  {
    key: 'image',
    title: 'Image 模型',
    description: '适合图片理解或生图相关能力',
    badgeClass: 'bg-rose-100 text-rose-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'image' ? modelGroups.value.image : []
  },
  {
    key: 'video',
    title: 'Video 模型',
    description: '适合视频相关能力或多模态视频处理',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'video' ? modelGroups.value.video : []
  },
  {
    key: 'imageEdit',
    title: 'Image Edit 模型',
    description: '适合图像编辑与改图类能力',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'imageEdit' ? modelGroups.value.imageEdit : []
  }
])

const modelTagSummary = (model) => {
  const id = model.id.toLowerCase()
  const tags = []

  if (id.includes('thinking')) tags.push('thinking')
  if (id.includes('search')) tags.push('search')
  if (id.includes('image-edit')) tags.push('image-edit')
  else if (id.includes('image')) tags.push('image')
  if (id.includes('video')) tags.push('video')

  return tags
}

const getModelDisplayName = (model) => {
  return model.id
}

const setActiveModelFilter = (filterKey) => {
  activeModelFilter.value = filterKey

  if (modelsScrollContainer.value) {
    modelsScrollContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

const getFilterBadgeClass = (filterKey, bgClass, textClass, hoverClass, activeBgClass) => {
  return [
    'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300',
    activeModelFilter.value === filterKey
      ? `${activeBgClass} text-white`
      : `${bgClass} ${textClass} ${hoverClass}`
  ]
}

const getModelUseCase = (model) => {
  const id = model.id.toLowerCase()

  if (id.includes('coder')) {
    return '代码生成/编程'
  }

  if (id.includes('vl') || id.includes('omni')) {
    return '多模态理解'
  }

  if (id.includes('image-edit')) {
    return '图片编辑'
  }

  if (id.includes('image')) {
    return '图像生成/识图'
  }

  if (id.includes('video')) {
    return '视频理解'
  }

  if (id.includes('thinking')) {
    return '复杂推理'
  }

  if (id.includes('search')) {
    return '联网搜索'
  }

  if (id.includes('flash')) {
    return '快速响应'
  }

  return '通用对话'
}

const copyModelRequestExample = async (model) => {
  const example = {
    model: model.id,
    messages: [
      {
        role: 'user',
        content: '你好，请介绍一下这个模型的适用场景。'
      }
    ],
    stream: false
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(example, null, 2))
    showToast(`已复制 ${model.id} 的请求示例`)
  } catch (error) {
    console.error('复制模型请求示例失败:', error)
    showToast('复制请求示例失败', 'error')
  }
}

const getModelsErrorMessage = (error) => {
  if (error.response) {
    const status = error.response.status
    const backendMessage = error.response.data?.error || error.response.data?.message

    if (status === 401 || status === 403) {
      return '当前 API Key 没有访问模型列表的权限，请检查管理员密钥或重新登录。'
    }

    if (status === 404) {
      return '模型列表接口不存在，请确认当前服务版本是否已正确部署。'
    }

    if (status >= 500) {
      return `服务端返回 ${status} 错误。${backendMessage ? `\n后端信息：${backendMessage}` : ''}`
    }

    return `请求失败，状态码 ${status}。${backendMessage ? `\n后端信息：${backendMessage}` : ''}`
  }

  if (error.request) {
    return '请求已发出，但没有收到服务响应。请检查当前 Space 是否正在重启或网络是否可用。'
  }

  return `请求构造失败：${error.message}`
}

const isSelected = (email) => {
  return selectedTokens.value.includes(email)
}

const toggleSelect = (email) => {
  const index = selectedTokens.value.indexOf(email)
  if (index === -1) {
    selectedTokens.value.push(email)
  } else {
    selectedTokens.value.splice(index, 1)
  }
  // 更新全选状态
  selectAll.value = selectedTokens.value.length === displayedTokens.value.length
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    // 全选当前页
    selectedTokens.value = displayedTokens.value.map(token => token.email)
  } else {
    // 取消全选
    selectedTokens.value = []
  }
}

const deleteSelected = async () => {
  if (selectedTokens.value.length === 0) return
  
  if (!confirm(`确定要删除选中的 ${selectedTokens.value.length} 个账号吗？`)) return
  
  try {
    // 批量删除，这里假设后端支持批量删除，如果不支持，需要循环调用单个删除
    const deletePromises = selectedTokens.value.map(email => 
      axios.delete('/api/deleteAccount', {
        data: { email },
        headers: {
          'Authorization': localStorage.getItem('apiKey') || ''
        }
      })
    )
    
    await Promise.all(deletePromises)
    await getTokens()
    selectedTokens.value = []
    selectAll.value = false
    showToast('删除成功')
  } catch (error) {
    console.error('批量删除失败:', error)
    showToast('批量删除失败: ' + error.message, 'error')
  }
}

const deleteAllAccounts = async () => {
  try {
    // 先获取全部账号数据
    const res = await axios.get('/api/getAllAccounts', {
      params: { page: 1, pageSize: 10000 },
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    const allAccounts = res.data.data

    const deletePromises = allAccounts.map(token =>
      axios.delete('/api/deleteAccount', {
        data: { email: token.email },
        headers: {
          'Authorization': localStorage.getItem('apiKey') || ''
        }
      })
    )

    await Promise.all(deletePromises)
    showDeleteAllConfirm.value = false
    currentPage.value = 1
    await getTokens()
    selectedTokens.value = []
    selectAll.value = false
    showToast('所有账号已删除')
  } catch (error) {
    console.error('删除所有账号失败:', error)
    showToast('删除所有账号失败: ' + error.message, 'error')
  }
}

const changePage = async (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // 重置选择状态
    selectedTokens.value = []
    selectAll.value = false
    await getTokens()
  }
}

const changePageSize = async () => {
  currentPage.value = 1
  // 重置选择状态
  selectedTokens.value = []
  selectAll.value = false
  await getTokens()
}

const showToast = (message, type = 'success') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true

  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    showToast('复制失败', 'error')
  }
}

const getTokens = async () => {
  isLoading.value = true
  try {
    const res = await axios.get('/api/getAllAccounts', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      },
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })

    displayedTokens.value = res.data.data
    totalItems.value = res.data.total

    // 如果当前页超出了总页数，重置到第一页并重新获取
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1
      await getTokens()
      return
    }

    // 重置选择状态
    selectedTokens.value = []
    selectAll.value = false

  } catch (error) {
    console.error('获取Token列表失败:', error)
    showToast('获取Token列表失败: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const addToken = async () => {
  try {
    await axios.post('/api/setAccount', newAccount.value, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    showAddModal.value = false
    newAccount.value = { email: '', password: '' }
    await getTokens()
    showToast('添加账号成功')
  } catch (error) {
    console.error('添加账号失败:', error)
    showToast('添加账号失败: ' + error.message, 'error')
  }
}

const addBatchTokens = async () => {
  try {
    await axios.post('/api/setAccounts', { accounts: batchAccounts.value }, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    showAddModal.value = false
    batchAccounts.value = ''
    await getTokens()
    showToast('批量添加任务已提交')
  } catch (error) {
    console.error('批量添加失败:', error)
    showToast('批量添加失败: ' + error.message, 'error')
  }
}

const refreshToken = async (email) => {
  if (refreshingTokens.value.includes(email)) return

  refreshingTokens.value.push(email)

  try {
    await axios.post('/api/refreshAccount', { email }, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })

    // 刷新成功后重新获取账号列表
    await getTokens()
    showToast(`账号 ${email} 令牌刷新成功`)
  } catch (error) {
    console.error('刷新账号令牌失败:', error)
    showToast('刷新账号令牌失败: ' + error.message, 'error')
  } finally {
    // 移除刷新状态
    const index = refreshingTokens.value.indexOf(email)
    if (index > -1) {
      refreshingTokens.value.splice(index, 1)
    }
  }
}

const refreshAllAccounts = async () => {
  if (isRefreshingAll.value) return

  if (!confirm('确定要刷新所有账号的令牌吗？这可能需要一些时间。')) return

  isRefreshingAll.value = true

  try {
    const response = await axios.post('/api/refreshAllAccounts', {
      thresholdHours: 24
    }, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })

    // 刷新成功后重新获取账号列表
    await getTokens()
    showToast(`批量刷新完成，成功刷新了 ${response.data.refreshedCount} 个账号`)
  } catch (error) {
    console.error('批量刷新失败:', error)
    showToast('批量刷新失败: ' + error.message, 'error')
  } finally {
    isRefreshingAll.value = false
  }
}

const forceRefreshAllAccounts = async () => {
  if (isForceRefreshingAll.value) return

  if (!confirm('确定要强制刷新所有账号的令牌吗？这将刷新所有账号，不管它们是否即将过期，可能需要较长时间。')) return

  isForceRefreshingAll.value = true

  try {
    const response = await axios.post('/api/forceRefreshAllAccounts', {}, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })

    // 刷新成功后重新获取账号列表
    await getTokens()
    showToast(`强制刷新完成，成功刷新了 ${response.data.refreshedCount} 个账号`)
  } catch (error) {
    console.error('强制刷新失败:', error)
    showToast('强制刷新失败: ' + error.message, 'error')
  } finally {
    isForceRefreshingAll.value = false
  }
}

const deleteToken = async (email) => {
  if (!confirm('确定要删除此账号吗？')) return

  try {
    await axios.delete('/api/deleteAccount', {
      data: { email },
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    await getTokens()
    showToast('删除账号成功')
  } catch (error) {
    console.error('删除账号失败:', error)
    showToast('删除账号失败: ' + error.message, 'error')
  }
}

const exportAccounts = async () => {
  try {
    // 获取全部账号用于导出
    const res = await axios.get('/api/getAllAccounts', {
      params: { page: 1, pageSize: 10000 },
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    const allAccounts = res.data.data

    if (allAccounts.length === 0) {
      showToast('没有可导出的账号', 'error')
      return
    }

    // 构建导出内容，格式为"账号:密码"，每行一个
    const content = allAccounts.map(token => `${token.email}:${token.password}`).join('\n')

    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })

    // 创建下载链接并触发下载
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'qwen_accounts.txt'
    document.body.appendChild(link)
    link.click()

    // 清理
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)

    showToast('导出完成')
  } catch (error) {
    console.error('导出失败:', error)
    showToast('导出失败: ' + error.message, 'error')
  }
}

const getAvailableModels = async () => {
  isLoadingModels.value = true
  modelsError.value = ''

  try {
    const response = await axios.get('/v1/models', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('apiKey') || ''}`
      }
    })

    const models = Array.isArray(response.data?.data) ? response.data.data : []
    availableModels.value = [...models].sort((a, b) => a.id.localeCompare(b.id))
  } catch (error) {
    console.error('获取模型列表失败:', error)
    modelsError.value = getModelsErrorMessage(error)
  } finally {
    isLoadingModels.value = false
  }
}

const refreshModels = async () => {
  await getAvailableModels()

  if (!modelsError.value) {
    showToast('模型列表已刷新')
  }
}

const openModelsPanel = async () => {
  showModelsPanel.value = true
  modelKeyword.value = ''
  activeModelFilter.value = 'all'

  if (!availableModels.value.length) {
    await getAvailableModels()
  }
}

onMounted(() => {
  getTokens()
})
</script>

<style lang="css" scoped>
@media (max-width: 640px) {
  .container {
    padding: 0;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.token-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.3));
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.token-card:hover {
  transform: translateY(-5px);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.token-card {
  animation: slideIn 0.5s ease-out;
  animation-fill-mode: both;
}

.token-card:nth-child(3n+1) { animation-delay: 0.1s; }
.token-card:nth-child(3n+2) { animation-delay: 0.2s; }
.token-card:nth-child(3n+3) { animation-delay: 0.3s; }

.overflow-x-auto {
  position: relative;
  cursor: pointer;
}

.overflow-x-auto::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 24px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8));
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.overflow-x-auto:hover::after {
  opacity: 1;
}

/* 隐藏滚动条样式 */
.scrollbar-hidden {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

/* 自定义滚动条样式（备用） */
.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

/* 自定义复选框样式 */
.custom-checkbox .checkbox-icon {
  position: relative;
  overflow: hidden;
}

.custom-checkbox .checkbox-icon:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: rgba(99, 102, 241, 0.1);
  transition: width 0.3s ease;
}

.custom-checkbox:hover .checkbox-icon:before {
  width: 100%;
}

.custom-checkbox input:checked + .checkbox-icon svg {
  animation: check-animation 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
  transform: scale(1);
}

@keyframes check-animation {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 给选中的卡片添加动画效果 */
.token-card.ring-2 {
  animation: selected-pulse 2s infinite;
}

@keyframes selected-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

/* 马卡龙紫色刷新按钮动画 */
@keyframes refresh-pulse-purple {
  0% {
    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(168, 85, 247, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
  }
}

/* 马卡龙绿色刷新按钮动画 */
@keyframes refresh-pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(74, 222, 128, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
  }
}

/* 马卡龙粉色刷新按钮动画 */
@keyframes refresh-pulse-pink {
  0% {
    box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(236, 72, 153, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(236, 72, 153, 0);
  }
}

.action-button:hover {
  animation: refresh-pulse-purple 1.5s infinite;
}

/* 刷新中的按钮样式 - 马卡龙紫色 */
.refreshing-button-purple {
  background: linear-gradient(45deg, #c084fc, #a855f7);
  color: white;
  animation: refresh-pulse-purple 1.5s infinite;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
}

/* 刷新中的按钮样式 - 马卡龙绿色 */
.refreshing-button-green {
  background: linear-gradient(45deg, #86efac, #4ade80);
  color: white;
  animation: refresh-pulse-green 1.5s infinite;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);
}

/* 刷新中的按钮样式 - 马卡龙粉色 */
.refreshing-button-pink {
  background: linear-gradient(45deg, #f472b6, #ec4899);
  color: white;
  animation: refresh-pulse-pink 1.5s infinite;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

/* 马卡龙色系按钮增强效果 */
.action-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 单个刷新按钮的马卡龙绿色样式增强 */
.text-green-600:hover {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  border-color: #86efac !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

/* 绿色刷新按钮的基础样式 */
.bg-green-50 {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
}

.bg-green-50:hover {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #86efac;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

/* 马卡龙绿色按钮样式 */
.macaron-green-button {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.macaron-green-button:hover {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #86efac;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

/* 马卡龙紫色按钮样式 */
.macaron-purple-button {
  background: linear-gradient(135deg, #faf5ff, #f3e8ff);
  border: 1px solid #e9d5ff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.macaron-purple-button:hover {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border-color: #c4b5fd;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
}

/* 马卡龙粉色按钮样式 */
.macaron-pink-button {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  border: 1px solid #f9a8d4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.macaron-pink-button:hover {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: #f472b6;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.2);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .action-button {
    min-height: 44px;
    font-size: 0.875rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    padding: 0 0.5rem;
  }

  /* 分页按钮 */
  .flex.space-x-2.items-center button {
    min-height: 40px;
    min-width: 72px;
    font-size: 0.875rem;
  }

  /* 多选操作按钮 */
  .flex.justify-between.items-center button {
    min-height: 40px;
    padding: 0.5rem 0.875rem;
  }

  /* 卡片内按钮 */
  .token-card button {
    min-height: 44px;
  }
}
</style>
