<template>
  <div class="w-100vw h-100vh p-4 overflow-y-auto">
    <div class="container mx-auto pt-5">
      <div class="vc-shell mb-6 flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="vc-title text-[28px]">Qwen2API Token Manager</h1>
          <p class="vc-subtitle mt-1">统一管理账号、模型、统计、日志与系统设置</p>
        </div>

        <div class="flex flex-1 items-center justify-center">
          <div class="flex max-w-2xl flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span :class="['inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold', connectionStatus === 'connected' ? 'bg-slate-950 text-white' : connectionStatus === 'checking' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500']">
              <span :class="[
                'h-2 w-2 rounded-full',
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'checking'
                    ? 'bg-slate-400 animate-pulse'
                    : 'bg-slate-400'
              ]"></span>
              {{ connectionStatusLabel }}
            </span>
            <span class="break-all text-slate-500">{{ siteBaseUrl }}</span>
            <button @click="copyToClipboard(siteBaseUrl)" class="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50" title="复制当前站点地址">
              复制 URL
            </button>
            <button @click="refreshConnectionStatus" :disabled="isCheckingConnection" class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" title="刷新连接状态">
              <svg :class="['h-4 w-4', isCheckingConnection ? 'animate-spin' : '']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 016.582 15m13.418 0H15" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex justify-end">
          <button @click="logout" class="vc-button-secondary whitespace-nowrap">退出登录</button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside class="vc-shell h-fit p-5 lg:sticky lg:top-4">
          <div class="space-y-3">
            <button @click="setDashboardTab('accounts')" :class="getSidebarItemClass('accounts', 'emerald')">账号列表</button>
            <button @click="showAddModal = true" :class="getActionSidebarClass('green')">添加账号</button>
            <button @click="refreshAllAccounts" :disabled="isRefreshingAll" :class="getActionSidebarClass('purple', isRefreshingAll)">
              {{ isRefreshingAll ? '一键刷新中...' : '一键刷新' }}
            </button>
            <button @click="forceRefreshAllAccounts" :disabled="isForceRefreshingAll" :class="getActionSidebarClass('pink', isForceRefreshingAll)">
              {{ isForceRefreshingAll ? '强制刷新中...' : '强制刷新' }}
            </button>
            <button @click="exportAccounts" :class="getActionSidebarClass('yellow')">导出账号</button>
            <button @click="openModelsPanel" :class="getSidebarItemClass('models', 'violet')">可用模型</button>
            <button @click="openUsagePanel" :class="getSidebarItemClass('usage', 'amber')">使用统计</button>
            <button @click="openLogsPanel" :class="getSidebarItemClass('logs', 'slate')">日志查看</button>
            <button @click="setDashboardTab('settings')" :class="getSidebarItemClass('settings', 'blue')">系统设置</button>
          </div>
        </aside>

        <section class="vc-shell p-4 md:p-6">
          <div v-if="activeDashboardTab === 'accounts'">
            <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 class="text-2xl font-bold text-slate-800">账号列表</h2>
                <p class="mt-2 text-sm text-slate-500">集中管理邮箱账号、令牌与批量操作</p>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>共 {{ totalItems }} 个账号</span>
                <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <span>每页显示</span>
                  <select v-model="pageSize" @change="changePageSize" class="rounded-lg border-none bg-transparent py-0 pr-6 text-sm text-slate-700 shadow-none focus:ring-0">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                    <option :value="200">200</option>
                  </select>
                </div>
              </div>
            </div>

      <!-- 分页控制区 -->
      <div class="mb-3 flex flex-wrap justify-between gap-3 px-1">
        <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <span>共 {{ totalItems }} 项</span>
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1" 
            :class="[
              'px-3 py-1 rounded-lg transition-all duration-200 text-sm', 
              currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            ]"
          >
            上一页
          </button>
          <span>{{ currentPage }}/{{ totalPages }}</span>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages || totalPages === 0" 
            :class="[
              'px-3 py-1 rounded-lg transition-all duration-200 text-sm', 
              currentPage === totalPages || totalPages === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            ]"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 多选操作区 -->
      <div class="mb-4 flex flex-wrap justify-between gap-3 px-1">
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <label class="inline-flex items-center cursor-pointer group">
            <div class="relative">
              <input type="checkbox" 
                    v-model="selectAll" 
                    @change="toggleSelectAll" 
                    class="sr-only peer">
              <div class="w-6 h-6 bg-white border-2 border-slate-300 rounded-lg peer-checked:bg-slate-950 peer-checked:border-slate-950 transition-all duration-300 flex items-center justify-center">
                <svg v-show="selectAll" class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <span class="ml-2 text-slate-700 group-hover:text-slate-950 transition-colors duration-200">全选</span>
          </label>
          <button 
            @click="deleteSelected" 
            :disabled="selectedTokens.length === 0" 
            :class="[
              'px-4 py-1.5 rounded-lg transition-all duration-300 border flex items-center space-x-1', 
              selectedTokens.length === 0 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
          class="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200 flex items-center space-x-1 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>删除全部账号</span>
        </button>
      </div>

      <!-- Token列表 -->
      <div class="max-h-[calc(75vh)] overflow-y-auto pr-2 scrollbar-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-1">
          <div v-for="token in displayedTokens" 
               :key="token.email" 
               class="token-card group relative overflow-hidden rounded-2xl transition-all duration-300 pt-3"
               :class="{'ring-2 ring-slate-900 ring-opacity-20': isSelected(token.email)}">
            <div class="absolute top-3 left-3 z-10">
              <label class="custom-checkbox cursor-pointer">
                <input type="checkbox" 
                       :checked="isSelected(token.email)" 
                       @change="toggleSelect(token.email)"
                       class="sr-only peer">
                <div class="checkbox-icon w-6 h-6 bg-white/90 backdrop-blur-sm border-2 border-slate-300 rounded-lg peer-checked:bg-slate-950 peer-checked:border-slate-950 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow">
                  <svg v-show="isSelected(token.email)" class="w-4 h-4 text-white transform scale-0 peer-checked:scale-100 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </label>
            </div>
            <div class="absolute inset-0 bg-white/55 backdrop-blur-md border border-white/40"></div>
            <div class="relative p-4 flex flex-col gap-3">
              <div class="flex flex-col space-y-2">
                <div class="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-slate-500 min-w-[74px] text-left text-xs font-semibold tracking-wide">EMAIL</span>
                    <span class="font-medium whitespace-nowrap text-left">{{ token.email }}</span>
                  </div>
                  <button @click="copyToClipboard(token.email)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity rounded-lg border border-slate-200 bg-white px-2 py-1 text-base hover:bg-slate-100">📋</button>
                </div>
                <div class="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-slate-500 min-w-[74px] text-left text-xs font-semibold tracking-wide">PASSWD</span>
                    <span class="font-medium whitespace-nowrap text-left">{{ token.password }}</span>
                  </div>
                  <button @click="copyToClipboard(token.password)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity rounded-lg border border-slate-200 bg-white px-2 py-1 text-base hover:bg-slate-100">📋</button>
                </div>
                <div class="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-slate-500 min-w-[74px] text-left text-xs font-semibold tracking-wide">TOKEN</span>
                    <span class="font-medium whitespace-nowrap text-left text-sm">{{ token.token }}</span>
                  </div>
                  <button @click="copyToClipboard(token.token)" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity rounded-lg border border-slate-200 bg-white px-2 py-1 text-base hover:bg-slate-100">📋</button>
                </div>
                <div class="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-1.5">
                  <div class="overflow-x-auto scrollbar-hide flex-1 flex items-center space-x-2">
                    <span class="text-slate-500 min-w-[74px] text-left text-xs font-semibold tracking-wide">EXPIRE</span>
                    <span class="font-medium whitespace-nowrap text-left text-sm">{{ new Date(token.expires * 1000).toLocaleString() }}</span>
                  </div>
                  <button @click="copyToClipboard(new Date(token.expires * 1000).toLocaleString())" class="absolute right-2 opacity-0 hover:opacity-100 transition-opacity rounded-lg border border-slate-200 bg-white px-2 py-1 text-base hover:bg-slate-100">📋</button>
                </div>
              </div>
              
              <div class="pt-3 mt-auto border-t border-gray-200/50 grid grid-cols-2 gap-2">
                <button @click="refreshToken(token.email)"
                        :disabled="refreshingTokens.includes(token.email)"
                        :class="[
                          'w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-sm border',
                          refreshingTokens.includes(token.email)
                            ? 'bg-green-400 text-white refreshing-button-green cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                        class="w-full border border-slate-200 bg-white text-slate-700 py-2 rounded-lg transition-all duration-300 hover:bg-slate-50 text-sm">
                  删除账号
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
          </div>

          <div v-else-if="activeDashboardTab === 'models'">
            <div class="mb-6">
              <h2 class="text-2xl font-bold text-slate-800">可用模型</h2>
              <p class="mt-2 text-sm text-slate-500">查看当前实例全部模型，并按分类与强度筛选</p>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>共 {{ availableModels.length }} 个模型</span>
                <button @click="setActiveModelFilter('all')" :class="['rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200', activeModelFilter === 'all' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50']">全部 {{ availableModels.length }}</button>
                <button @click="setActiveModelFilter('base')" :class="getFilterBadgeClass('base')">基础 {{ allModelGroups.base.length }}</button>
                <button @click="setActiveModelFilter('thinking')" :class="getFilterBadgeClass('thinking')">Thinking {{ allModelGroups.thinking.length }}</button>
                <button @click="setActiveModelFilter('search')" :class="getFilterBadgeClass('search')">Search {{ allModelGroups.search.length }}</button>
                <button @click="setActiveModelFilter('image')" :class="getFilterBadgeClass('image')">Image {{ allModelGroups.image.length }}</button>
                <button @click="setActiveModelFilter('video')" :class="getFilterBadgeClass('video')">Video {{ allModelGroups.video.length }}</button>
                <button @click="setActiveModelFilter('imageEdit')" :class="getFilterBadgeClass('imageEdit')">Image Edit {{ allModelGroups.imageEdit.length }}</button>
              </div>
              <div class="flex w-full sm:w-auto gap-2">
                <div class="relative w-full sm:w-72">
                  <input v-model="modelKeyword" type="text" placeholder="搜索模型 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-violet-400 focus:ring-violet-400 transition-all duration-300">
                </div>
                <button @click="refreshModels" :disabled="isLoadingModels" :class="['rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 border', isLoadingModels ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-950 text-white border-slate-950 hover:bg-slate-800']">{{ isLoadingModels ? '刷新中...' : '刷新模型列表' }}</button>
              </div>
            </div>

            <div v-if="isLoadingModels" class="py-12 text-center text-slate-500">正在加载模型列表...</div>
            <div v-else-if="modelsError" class="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-700">
              <div class="text-lg font-semibold">模型列表加载失败</div>
              <div class="mt-2 text-sm whitespace-pre-line">{{ modelsError }}</div>
              <button @click="refreshModels" class="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-200">重新加载</button>
            </div>
            <div v-else ref="modelsScrollContainer" class="max-h-[70vh] overflow-y-auto pr-2">
              <div class="space-y-5">
                <div v-for="group in groupedModelSections" :key="group.key" v-show="group.models.length" class="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 class="text-lg font-semibold text-slate-800">{{ group.title }}</h3>
                      <p class="text-xs text-slate-500 mt-1">{{ group.description }}</p>
                      <p class="mt-2 text-xs text-slate-400">当前分类已按模型强度从高到低排序</p>
                    </div>
                    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{{ group.models.length }} 个</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <div v-for="model in group.models" :key="model.id" class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-1">
                          <div class="font-semibold text-slate-800 break-all">{{ model.id }}</div>
                          <div class="mt-2 text-xs text-slate-500 break-all">模型名称：{{ getModelDisplayName(model) }}</div>
                          <div class="mt-2 flex flex-wrap gap-2">
                            <span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{{ model.owned_by || 'unknown' }}</span>
                            <span v-if="modelTagSummary(model).length" class="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">{{ modelTagSummary(model).join(' / ') }}</span>
                            <span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">推荐：{{ getModelUseCase(model) }}</span>
                            <div class="relative group/tooltip inline-flex">
                              <span class="cursor-help rounded-full border border-slate-200 bg-slate-900 px-2 py-1 text-xs text-white">强度：{{ getModelPriorityLabel(model, group.key) }}</span>
                              <div class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-xl backdrop-blur-sm group-hover/tooltip:block">
                                <div class="font-semibold text-slate-900">强度说明</div>
                                <div class="mt-2 leading-5 whitespace-pre-line">{{ getModelPriorityTooltip(model, group.key) }}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <button @click="copyToClipboard(model.id)" class="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200">复制 ID</button>
                        <button @click="copyToClipboard(getModelDisplayName(model))" class="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200">复制名字</button>
                        <button @click="copyModelRequestExample(model)" class="col-span-2 sm:col-span-1 rounded-lg bg-slate-950 px-2 py-2 text-sm text-white hover:bg-slate-800 transition-all duration-200">复制示例</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!filteredModelsByCategory.length" class="py-12 text-center text-slate-500">没有匹配的模型</div>
            </div>
          </div>

          <div v-else-if="activeDashboardTab === 'logs'">
            <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 class="text-2xl font-bold text-slate-800">运行日志</h2>
                <p class="mt-2 text-sm text-slate-500">查看服务内存日志，支持手动刷新、自动刷新、复制、下载和清空</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button @click="fetchLogs" class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition-all duration-300">刷新日志</button>
                <button @click="toggleAutoRefreshLogs" :class="['rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 border', logsAutoRefresh ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50']">
                  {{ logsAutoRefresh ? '停止自动刷新' : '自动刷新' }}
                </button>
                <button @click="downloadLogs" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">下载日志</button>
                <button @click="copyLogs" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">复制日志</button>
                <button @click="clearLogs" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">清空日志</button>
              </div>
            </div>

            <div class="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <div class="flex flex-wrap items-center gap-3">
                <select v-model="logsLevelFilter" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
                  <option value="ALL">全部级别</option>
                  <option value="DEBUG">DEBUG</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>
                <select v-model="logsModuleFilter" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
                  <option value="ALL">全部模块</option>
                  <option value="SERVER">SERVER</option>
                  <option value="ACCOUNT">ACCOUNT</option>
                  <option value="CHAT">CHAT</option>
                  <option value="CONFIG">CONFIG</option>
                  <option value="CLI">CLI</option>
                  <option value="SSXMOD">SSXMOD</option>
                  <option value="INFO">INFO</option>
                </select>
                <select v-model="logsLimit" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
                  <option value="100">最近 100 条</option>
                  <option value="200">最近 200 条</option>
                  <option value="500">最近 500 条</option>
                  <option value="ALL">全部</option>
                </select>
                <input v-model="logsKeyword" type="text" placeholder="搜索日志关键词" class="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <div class="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  <span>运行日志</span>
                <button @click="toggleRuntimeLog" :class="['rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200', runtimeLogEnabled ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']">
                  {{ runtimeLogEnabled ? '已启用' : '已关闭' }}
                </button>
                </div>
                <div class="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  <span>自动滚底</span>
                <button @click="logsAutoScroll = !logsAutoScroll" :class="['rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200', logsAutoScroll ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-700 hover:bg-slate-300']">
                  {{ logsAutoScroll ? '已开启' : '已关闭' }}
                </button>
                </div>
              </div>
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>当前日志条数：{{ logs.length }}</span>
              <span>筛选后：{{ filteredLogs.length }}</span>
              <span v-if="logsLastUpdated">最后刷新：{{ logsLastUpdated }}</span>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-slate-950 text-slate-100 shadow-inner overflow-hidden">
                <div ref="logsScrollContainer" class="max-h-[70vh] overflow-y-auto p-4 font-mono text-xs leading-6 break-words">
                  <div v-if="isLoadingLogs" class="text-slate-400">正在加载日志...</div>
                  <div v-else-if="logsError" class="text-red-300">{{ logsError }}</div>
                  <div v-else-if="!logs.length" class="text-slate-500">当前没有可显示的日志</div>
                  <div v-else class="space-y-1" v-html="formattedLogsHtml"></div>
                </div>
            </div>
          </div>

          <div v-else-if="activeDashboardTab === 'usage'">
            <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 class="text-2xl font-bold text-slate-800">使用统计</h2>
                <p class="mt-2 text-sm text-slate-500">按模型查看请求次数、Token 数量和成功率</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <input v-model="usageKeyword" type="text" placeholder="搜索模型名称" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
                <button @click="usageOnlyToday = !usageOnlyToday" :class="['rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 border', usageOnlyToday ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50']">{{ usageOnlyToday ? '仅看今天中' : '仅看今天' }}</button>
                <button @click="usageOnlyFailed = !usageOnlyFailed" :class="['rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 border', usageOnlyFailed ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50']">{{ usageOnlyFailed ? '仅失败中' : '仅看失败模型' }}</button>
                <select v-model="usageSortBy" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-slate-400 transition-all duration-300">
                  <option value="totalTokens">按总 Token 排序</option>
                  <option value="requests">按请求次数排序</option>
                </select>
                <button @click="fetchUsageStats" class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition-all duration-300">刷新统计</button>
                <button @click="resetUsageStats" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">清空统计</button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-7 mb-6">
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">总请求数</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ usageSummary.requests }}</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">成功请求</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ usageSummary.success }}</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">失败请求</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ usageSummary.failed }}</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">总 Token</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ formatNumber(usageSummary.totalTokens) }}</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">成功率</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ usageSummary.successRate }}%</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">今日请求</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ usageSummary.today?.requests || 0 }}</div></div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"><div class="text-xs text-slate-500">今日 Token</div><div class="mt-2 text-2xl font-bold text-slate-800">{{ formatNumber(usageSummary.today?.totalTokens || 0) }}</div></div>
            </div>

            <div class="mb-6 grid gap-6 xl:grid-cols-2">
              <div class="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div class="mb-4">
                  <h3 class="text-lg font-semibold text-slate-800">今日请求趋势</h3>
                  <p class="mt-1 text-xs text-slate-500">按小时统计请求次数</p>
                </div>
                <div class="grid grid-cols-12 md:grid-cols-24 gap-2 items-end h-52 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div v-for="item in usageTrendData" :key="`requests-${item.hour}`" class="flex flex-col items-center justify-end gap-2 h-full">
                    <div class="w-full rounded-t-md bg-slate-900 min-h-[8px] shadow-[0_8px_20px_rgba(15,23,42,0.08)]" :style="{ height: item.requestHeight }"></div>
                    <div class="text-[10px] text-slate-400 tracking-wide">{{ String(item.hour).padStart(2, '0') }}</div>
                  </div>
                </div>
              </div>

              <div class="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div class="mb-4">
                  <h3 class="text-lg font-semibold text-slate-800">今日 Token 趋势</h3>
                  <p class="mt-1 text-xs text-slate-500">按小时统计 Token 消耗</p>
                </div>
                <div class="grid grid-cols-12 md:grid-cols-24 gap-2 items-end h-52 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div v-for="item in usageTrendData" :key="`tokens-${item.hour}`" class="flex flex-col items-center justify-end gap-2 h-full">
                    <div class="w-full rounded-t-md bg-slate-500 min-h-[8px] shadow-[0_8px_20px_rgba(15,23,42,0.06)]" :style="{ height: item.tokenHeight }"></div>
                    <div class="text-[10px] text-slate-400 tracking-wide">{{ String(item.hour).padStart(2, '0') }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="usageStatsFilePath" class="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
              当前统计文件路径：<span class="font-mono text-slate-700 break-all">{{ usageStatsFilePath }}</span>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white/80 shadow-sm overflow-hidden">
              <div class="max-h-[60vh] overflow-auto">
                <table class="min-w-full text-sm">
                  <thead class="sticky top-0 z-10 bg-slate-100 text-slate-600">
                    <tr>
                      <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">模型名称</th>
                      <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">请求次数</th>
                      <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">Prompt Tokens</th>
                      <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">Completion Tokens</th>
                      <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">总 Token</th>
                      <th class="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">成功率</th>
                      <th class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">最近使用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="isLoadingUsageStats">
                      <td colspan="7" class="px-4 py-10 text-center text-slate-500">正在加载使用统计...</td>
                    </tr>
                    <tr v-else-if="usageStatsError">
                      <td colspan="7" class="px-4 py-10 text-center text-red-500">{{ usageStatsError }}</td>
                    </tr>
                    <tr v-else-if="!sortedUsageModels.length">
                      <td colspan="7" class="px-4 py-10 text-center text-slate-500">暂无统计数据</td>
                    </tr>
                    <tr v-for="item in sortedUsageModels" :key="item.model" class="border-t border-slate-100 hover:bg-slate-50/70">
                      <td class="px-4 py-3 font-medium text-slate-800 break-all">{{ item.model }}</td>
                      <td class="px-4 py-3 text-right text-slate-600">{{ formatNumber(item.requests) }}</td>
                      <td class="px-4 py-3 text-right text-slate-600">{{ formatNumber(item.promptTokens) }}</td>
                      <td class="px-4 py-3 text-right text-slate-600">{{ formatNumber(item.completionTokens) }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-slate-800">{{ formatNumber(item.totalTokens) }}</td>
                      <td class="px-4 py-3 text-right"><span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{{ item.successRate }}%</span></td>
                      <td class="px-4 py-3 text-slate-500">{{ item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="mb-6">
              <h2 class="text-2xl font-bold text-slate-800">系统设置</h2>
              <p class="mt-2 text-sm text-slate-500">直接在当前仪表盘中维护 API Key 与系统行为配置</p>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 class="text-lg font-semibold text-slate-800">API Key 管理</h3>
                    <p class="mt-1 text-sm text-slate-500">管理员密钥只读，普通密钥可动态增删</p>
                  </div>
                  <button @click="showAddKeyModal = true" class="vc-button-primary">添加密钥</button>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div class="mb-2 flex items-center gap-2">
                    <span class="font-semibold text-slate-800">管理员密钥</span>
                    <span class="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">不可修改</span>
                  </div>
                  <input :value="settings.adminKey" type="text" readonly class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                </div>

                <div class="space-y-3">
                  <div v-if="settings.regularKeys.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">暂无普通密钥</div>
                  <div v-for="(key, index) in settings.regularKeys" :key="index" class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
                    <input :value="key" type="text" readonly class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                    <button @click="deleteRegularKey(index)" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">删除</button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <h3 class="text-lg font-semibold text-slate-800">自动刷新</h3>
                  <div class="mt-4 flex items-center gap-3">
                    <input v-model="settings.autoRefresh" type="checkbox" class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm text-slate-600">启用自动刷新</span>
                  </div>
                  <label class="mt-4 block text-sm text-slate-500">刷新间隔（秒）</label>
                  <input v-model.number="settings.autoRefreshInterval" type="number" class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <button @click="saveAutoRefresh" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-300">保存</button>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <h3 class="text-lg font-semibold text-slate-800">思考输出</h3>
                  <div class="mt-4 flex items-center gap-3">
                    <input v-model="settings.outThink" type="checkbox" class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm text-slate-600">启用思考输出</span>
                  </div>
                  <button @click="saveOutThink" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-300">保存</button>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <h3 class="text-lg font-semibold text-slate-800">搜索信息显示模式</h3>
                  <select v-model="settings.searchInfoMode" class="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <option value="table">表格模式</option>
                    <option value="text">文本模式</option>
                  </select>
                  <button @click="saveSearchInfoMode" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-300">保存</button>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <h3 class="text-lg font-semibold text-slate-800">简化模型映射</h3>
                  <div class="mt-4 flex items-start gap-3">
                    <input v-model="settings.simpleModelMap" type="checkbox" class="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm leading-6 text-slate-600">只返回基础模型，不包含 thinking、search、image 等变体</span>
                  </div>
                  <button @click="saveSimpleModelMap" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-300">保存</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-if="showAddKeyModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showAddKeyModal = false">
      <div class="vc-shell w-96 max-w-[90vw] p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">添加普通 API Key</h3>
        <input v-model="newApiKey" type="text" placeholder="请输入 API Key" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 mb-4">
        <div class="flex justify-end gap-3">
          <button @click="showAddKeyModal = false" class="vc-button-secondary">取消</button>
          <button @click="addRegularKey" class="vc-button-primary">添加</button>
        </div>
      </div>
    </div>

    <!-- 删除全部确认对话框 -->
    <div v-if="showDeleteAllConfirm" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         @click.self="showDeleteAllConfirm = false">
      <div class="vc-shell w-11/12 max-w-md p-6">
        <h2 class="text-2xl font-bold text-slate-950 mb-4">危险操作确认</h2>
        <p class="text-slate-600 mb-6">您确定要删除<span class="font-bold text-slate-950">全部 {{ totalItems }} 个</span>账号吗？此操作不可恢复。</p>
        <div class="flex justify-end space-x-4">
          <button @click="showDeleteAllConfirm = false" class="vc-button-secondary">
            取消
          </button>
          <button @click="deleteAllAccounts" class="vc-button-primary bg-slate-950 hover:bg-slate-800">
            确认删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加账号模态框 -->
    <div v-if="showAddModal" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         @click.self="showAddModal = false">
      <div class="vc-shell w-11/12 max-w-md p-6">
        <div class="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button :class="['rounded-2xl py-2 text-sm font-medium transition-all duration-200', addMode==='single' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white']" @click="addMode='single'">单账号添加</button>
          <button :class="['rounded-2xl py-2 text-sm font-medium transition-all duration-200', addMode==='batch' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white']" @click="addMode='batch'">批量添加</button>
        </div>
        <transition name="fade" mode="out-in">
          <div v-if="addMode==='single'" key="single">
            <h2 class="text-xl font-bold mb-4">添加账号</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">Email</label>
                <input v-model="newAccount.email" type="email" class="vc-input mt-1 h-12">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Password</label>
                <input v-model="newAccount.password" type="password" class="vc-input mt-1 h-12">
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button @click="showAddModal = false" class="vc-button-secondary">
                  取消
                </button>
                <button @click="addToken" class="vc-button-primary">
                  添加
                </button>
              </div>
            </div>
          </div>
          <div v-else key="batch">
            <h2 class="text-xl font-bold mb-4 px-4">批量添加账号</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 px-4 pb-2">账号列表（每行一个，格式：email:password）</label>
                <textarea v-model="batchAccounts" rows="6" class="vc-input mt-1 h-36 resize-none"></textarea>
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button @click="showAddModal = false" class="vc-button-secondary">
                  取消
                </button>
                <button @click="addBatchTokens" class="vc-button-primary">
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
           toast.type === 'success' ? 'bg-slate-950 text-white' : 'bg-slate-700 text-white'
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

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const tokens = ref([])
const showAddModal = ref(false)
const addMode = ref('single')
const newAccount = ref({
  email: '',
  password: ''
})
const batchAccounts = ref('')
const settings = ref({
  apiKey: localStorage.getItem('apiKey') || '',
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
const activeDashboardTab = ref('accounts')
const availableModels = ref([])
const isLoadingModels = ref(false)
const modelsError = ref('')
const modelKeyword = ref('')
const activeModelFilter = ref('all')
const modelsScrollContainer = ref(null)
const logs = ref([])
const isLoadingLogs = ref(false)
const logsError = ref('')
const logsAutoRefresh = ref(false)
const logsLastUpdated = ref('')
const logsLevelFilter = ref('ALL')
const logsModuleFilter = ref('ALL')
const logsKeyword = ref('')
const logsLimit = ref('200')
const runtimeLogEnabled = ref(true)
const logsAutoScroll = ref(true)
const logsScrollContainer = ref(null)
const siteBaseUrl = ref(typeof window !== 'undefined' ? window.location.origin : '')
const connectionStatus = ref('checking')
const isCheckingConnection = ref(false)
const usageSummary = ref({ requests: 0, success: 0, failed: 0, totalTokens: 0, successRate: 0 })
const usageModels = ref([])
const isLoadingUsageStats = ref(false)
const usageStatsError = ref('')
const usageSortBy = ref('totalTokens')
const usageKeyword = ref('')
const usageOnlyToday = ref(false)
const usageOnlyFailed = ref(false)
const usageStatsFilePath = ref('')
let logsRefreshTimer = null

// Toast 通知
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const connectionStatusLabel = computed(() => {
  if (connectionStatus.value === 'connected') return '已连接'
  if (connectionStatus.value === 'failed') return '连接失败'
  return '连接检测中'
})

const filteredLogs = computed(() => {
  const keyword = logsKeyword.value.trim().toLowerCase()

  const matchedLogs = logs.value.filter(item => {
    const text = item.text || ''
    const upperText = text.toUpperCase()
    const matchLevel = logsLevelFilter.value === 'ALL' || upperText.includes(`[${logsLevelFilter.value}]`)
    const matchModule = logsModuleFilter.value === 'ALL' || upperText.includes(`[${logsModuleFilter.value}]`)
    const matchKeyword = !keyword || text.toLowerCase().includes(keyword)
    return matchLevel && matchModule && matchKeyword
  })

  if (logsLimit.value === 'ALL') {
    return matchedLogs
  }

  const limit = parseInt(logsLimit.value, 10)
  if (Number.isNaN(limit) || limit <= 0) {
    return matchedLogs
  }

  return matchedLogs.slice(-limit)
})

const formattedLogs = computed(() => filteredLogs.value.map(item => item.text).join('\n'))

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const highlightLogLine = (text) => {
  let line = escapeHtml(text)
  line = line.replace(/\[(ERROR|WARN|INFO|DEBUG)\]/g, '<span class="inline-block rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">[$1]</span>')
  line = line.replace(/\[(SERVER|ACCOUNT|CHAT|CONFIG|CLI|SSXMOD|AUTO|REQUEST|PARSER|USAGE)\]/g, '<span class="inline-block rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">[$1]</span>')
  return `<div>${line}</div>`
}

const formattedLogsHtml = computed(() => filteredLogs.value.map(item => highlightLogLine(item.text)).join(''))

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

const getModelStrengthScore = (model, groupKey = 'base') => {
  const id = model.id.toLowerCase()
  let score = 0

  if (id.includes('max')) score += 120
  if (id.includes('plus')) score += 90
  if (id.includes('vl')) score += 82
  if (id.includes('omni')) score += 80
  if (id.includes('coder')) score += 78
  if (id.includes('flash')) score += 50
  if (id.includes('latest')) score += 18
  if (id.includes('thinking')) score += 8
  if (id.includes('search')) score += 6
  if (id.includes('image-edit')) score += 12
  else if (id.includes('image')) score += 10
  if (id.includes('video')) score += 10

  if (groupKey === 'base') {
    if (id.includes('max')) score += 20
    if (id.includes('flash')) score -= 8
  }

  if (groupKey === 'thinking') {
    if (id.includes('max')) score += 12
    if (id.includes('plus')) score += 10
    if (id.includes('flash')) score -= 6
  }

  if (groupKey === 'search') {
    if (id.includes('max')) score += 12
    if (id.includes('plus')) score += 8
    if (id.includes('flash')) score -= 5
  }

  if (groupKey === 'image' || groupKey === 'imageEdit' || groupKey === 'video') {
    if (id.includes('vl') || id.includes('omni')) score += 14
    if (id.includes('max')) score += 10
    if (id.includes('flash')) score -= 4
  }

  return score
}

const sortModelsByStrength = (models, groupKey) => {
  return [...models].sort((a, b) => {
    const scoreDiff = getModelStrengthScore(b, groupKey) - getModelStrengthScore(a, groupKey)
    if (scoreDiff !== 0) {
      return scoreDiff
    }

    return a.id.localeCompare(b.id)
  })
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
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'base' ? sortModelsByStrength(modelGroups.value.base, 'base') : []
  },
  {
    key: 'thinking',
    title: 'Thinking 模型',
    description: '带推理输出能力，适合复杂思考场景',
    badgeClass: 'bg-amber-100 text-amber-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'thinking' ? sortModelsByStrength(modelGroups.value.thinking, 'thinking') : []
  },
  {
    key: 'search',
    title: 'Search 模型',
    description: '带搜索能力，适合联网或检索场景',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'search' ? sortModelsByStrength(modelGroups.value.search, 'search') : []
  },
  {
    key: 'image',
    title: 'Image 模型',
    description: '适合图片理解或生图相关能力',
    badgeClass: 'bg-rose-100 text-rose-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'image' ? sortModelsByStrength(modelGroups.value.image, 'image') : []
  },
  {
    key: 'video',
    title: 'Video 模型',
    description: '适合视频相关能力或多模态视频处理',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'video' ? sortModelsByStrength(modelGroups.value.video, 'video') : []
  },
  {
    key: 'imageEdit',
    title: 'Image Edit 模型',
    description: '适合图像编辑与改图类能力',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    models: activeModelFilter.value === 'all' || activeModelFilter.value === 'imageEdit' ? sortModelsByStrength(modelGroups.value.imageEdit, 'imageEdit') : []
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

const getSidebarItemClass = (tabKey, tone) => {
  return [
    'w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200',
    activeDashboardTab.value === tabKey
      ? 'border-slate-900 bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]'
      : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
  ]
}

const getActionSidebarClass = (tone, disabled = false) => {
  return [
    'w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200',
    disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
  ]
}

const setDashboardTab = (tabKey) => {
  activeDashboardTab.value = tabKey
}

const goToSettings = () => {
  router.push('/settings')
}

const refreshConnectionStatus = async () => {
  isCheckingConnection.value = true
  connectionStatus.value = 'checking'

  try {
    await axios.get('/models', { timeout: 10000 })
    connectionStatus.value = 'connected'
    showToast('连接状态已刷新')
  } catch (error) {
    console.error('刷新连接状态失败:', error)
    connectionStatus.value = 'failed'
    showToast('连接检测失败', 'error')
  } finally {
    isCheckingConnection.value = false
  }
}

const logout = () => {
  localStorage.removeItem('apiKey')
  router.replace('/auth')
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('zh-CN').format(value || 0)
}

const sortedUsageModels = computed(() => {
  const keyword = usageKeyword.value.trim().toLowerCase()
  const items = usageModels.value.filter(item => {
    const source = usageOnlyToday.value ? (item.today || {}) : item
    const matchKeyword = !keyword || item.model.toLowerCase().includes(keyword)
    const matchFailed = !usageOnlyFailed.value || (source.failed || 0) > 0
    const matchToday = !usageOnlyToday.value || (source.requests || 0) > 0
    return matchKeyword && matchFailed && matchToday
  }).map(item => {
    if (!usageOnlyToday.value) {
      return item
    }

    const today = item.today || { requests: 0, success: 0, failed: 0, totalTokens: 0 }
    const successRate = today.requests > 0 ? Number(((today.success / today.requests) * 100).toFixed(2)) : 0

    return {
      ...item,
      requests: today.requests || 0,
      success: today.success || 0,
      failed: today.failed || 0,
      totalTokens: today.totalTokens || 0,
      promptTokens: today.totalTokens || 0,
      completionTokens: 0,
      successRate
    }
  })

  if (usageSortBy.value === 'requests') {
    return items.sort((a, b) => b.requests - a.requests || b.totalTokens - a.totalTokens)
  }

  return items.sort((a, b) => b.totalTokens - a.totalTokens || b.requests - a.requests)
})

const usageTrendData = computed(() => {
  const hourly = Array.isArray(usageSummary.value.today?.hourly) ? usageSummary.value.today.hourly : []
  const buckets = Array.from({ length: 24 }, (_, hour) => {
    const item = hourly.find(entry => entry.hour === hour) || { hour, requests: 0, totalTokens: 0 }
    return item
  })

  const maxRequests = Math.max(1, ...buckets.map(item => item.requests || 0))
  const maxTokens = Math.max(1, ...buckets.map(item => item.totalTokens || 0))

  return buckets.map(item => ({
    ...item,
    requestHeight: `${Math.max(8, Math.round(((item.requests || 0) / maxRequests) * 100))}%`,
    tokenHeight: `${Math.max(8, Math.round(((item.totalTokens || 0) / maxTokens) * 100))}%`
  }))
})

const fetchUsageStats = async () => {
  isLoadingUsageStats.value = true
  usageStatsError.value = ''
  try {
    const response = await axios.get('/api/usage-stats', {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    usageSummary.value = response.data?.summary || usageSummary.value
    usageModels.value = Array.isArray(response.data?.models) ? response.data.models : []
    usageStatsFilePath.value = response.data?.filePath || ''
  } catch (error) {
    console.error('获取使用统计失败:', error)
    usageStatsError.value = error.response?.data?.error || error.message || '获取使用统计失败'
  } finally {
    isLoadingUsageStats.value = false
  }
}

const loadSettings = async () => {
  try {
    const res = await axios.get('/api/settings', {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
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
    showToast('加载设置失败: ' + (error.response?.data?.error || error.message), 'error')
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
    showToast('自动刷新设置保存成功')
  } catch (error) {
    showToast('自动刷新设置保存失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const saveOutThink = async () => {
  try {
    await axios.post('/api/setOutThink', { outThink: settings.value.outThink }, {
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    showToast('思考输出设置保存成功')
  } catch (error) {
    showToast('思考输出设置保存失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const saveSearchInfoMode = async () => {
  try {
    await axios.post('/api/search-info-mode', { searchInfoMode: settings.value.searchInfoMode }, {
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    showToast('搜索信息模式保存成功')
  } catch (error) {
    showToast('搜索信息模式保存失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const saveSimpleModelMap = async () => {
  try {
    await axios.post('/api/simple-model-map', { simpleModelMap: settings.value.simpleModelMap }, {
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    showToast('简化模型映射设置保存成功')
  } catch (error) {
    showToast('简化模型映射设置保存失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const addRegularKey = async () => {
  if (!newApiKey.value.trim()) {
    showToast('请输入 API Key', 'error')
    return
  }

  try {
    await axios.post('/api/addRegularKey', { apiKey: newApiKey.value.trim() }, {
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    newApiKey.value = ''
    showAddKeyModal.value = false
    await loadSettings()
    showToast('API Key 添加成功')
  } catch (error) {
    showToast('API Key 添加失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const deleteRegularKey = async (index) => {
  if (!confirm('确定要删除此 API Key 吗？')) return

  const keyToDelete = settings.value.regularKeys[index]
  try {
    await axios.post('/api/deleteRegularKey', { apiKey: keyToDelete }, {
      headers: { 'Authorization': localStorage.getItem('apiKey') || '' }
    })
    await loadSettings()
    showToast('API Key 删除成功')
  } catch (error) {
    showToast('API Key 删除失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const resetUsageStats = async () => {
  if (!confirm('确定要清空全部使用统计吗？')) return

  try {
    await axios.post('/api/usage-stats/reset', {}, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    await fetchUsageStats()
    showToast('使用统计已清空')
  } catch (error) {
    console.error('清空使用统计失败:', error)
    showToast('清空使用统计失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const openUsagePanel = async () => {
  activeDashboardTab.value = 'usage'
  await fetchUsageStats()
}

const fetchLogs = async () => {
  isLoadingLogs.value = true
  logsError.value = ''
  try {
    const response = await axios.get('/api/logs', {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    logs.value = Array.isArray(response.data?.logs) ? response.data.logs : []
    runtimeLogEnabled.value = response.data?.runtimeLogEnabled !== false
    logsLastUpdated.value = new Date().toLocaleString()

    if (logsAutoScroll.value) {
      requestAnimationFrame(() => {
        if (logsScrollContainer.value) {
          logsScrollContainer.value.scrollTop = logsScrollContainer.value.scrollHeight
        }
      })
    }
  } catch (error) {
    console.error('获取日志失败:', error)
    logsError.value = error.response?.data?.error || error.message || '获取日志失败'
  } finally {
    isLoadingLogs.value = false
  }
}

const stopLogsAutoRefresh = () => {
  if (logsRefreshTimer) {
    clearInterval(logsRefreshTimer)
    logsRefreshTimer = null
  }
  logsAutoRefresh.value = false
}

const toggleAutoRefreshLogs = async () => {
  if (logsAutoRefresh.value) {
    stopLogsAutoRefresh()
    showToast('已停止自动刷新日志')
    return
  }

  await fetchLogs()
  logsAutoRefresh.value = true
  logsRefreshTimer = setInterval(fetchLogs, 5000)
  showToast('已开启自动刷新日志')
}

const downloadLogs = () => {
  const content = formattedLogs.value
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `qwen2api-logs-${Date.now()}.txt`
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
  showToast('日志已下载')
}

const copyLogs = async () => {
  await copyToClipboard(formattedLogs.value || '当前没有日志')
}

const clearLogs = async () => {
  try {
    await axios.post('/api/logs/clear', {}, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })
    logs.value = []
    logsLastUpdated.value = new Date().toLocaleString()
    showToast('日志已清空')
  } catch (error) {
    console.error('清空日志失败:', error)
    showToast('清空日志失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const toggleRuntimeLog = async () => {
  try {
    const response = await axios.post('/api/logs/runtime-log', {
      enabled: !runtimeLogEnabled.value
    }, {
      headers: {
        'Authorization': localStorage.getItem('apiKey') || ''
      }
    })

    runtimeLogEnabled.value = response.data?.runtimeLogEnabled !== false
    showToast(response.data?.message || '运行日志开关已更新')
  } catch (error) {
    console.error('切换运行日志失败:', error)
    showToast('切换运行日志失败: ' + (error.response?.data?.error || error.message), 'error')
  }
}

const openLogsPanel = async () => {
  activeDashboardTab.value = 'logs'
  await fetchLogs()
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

const getFilterBadgeClass = (filterKey) => {
  return [
    'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 border',
    activeModelFilter.value === filterKey
      ? 'border-slate-950 bg-slate-950 text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

const getModelPriorityLabel = (model, groupKey) => {
  const score = getModelStrengthScore(model, groupKey)

  if (score >= 125) return 'S'
  if (score >= 95) return 'A'
  if (score >= 70) return 'B'
  return 'C'
}

const getModelPriorityTooltip = (model, groupKey) => {
  const level = getModelPriorityLabel(model, groupKey)
  const useCase = getModelUseCase(model)
  const baseText = {
    S: 'S：该分类下的第一梯队，优先推荐使用。',
    A: 'A：该分类下的强势模型，适合大多数正式场景。',
    B: 'B：该分类下的均衡模型，适合常规使用。',
    C: 'C：该分类下的基础可用模型，适合轻量或备用场景。'
  }

  return `${baseText[level]}\n推荐用途：${useCase}`
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
  activeDashboardTab.value = 'models'
  modelKeyword.value = ''
  activeModelFilter.value = 'all'

  if (!availableModels.value.length) {
    await getAvailableModels()
  }
}

onMounted(() => {
  getTokens()
  loadSettings()
  refreshConnectionStatus()
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
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
  transform: translateY(0);
  transition: all 0.2s ease;
}

.token-card:hover {
  transform: translateY(-3px);
  border-color: rgba(15, 23, 42, 0.14);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
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
  background: rgba(15, 23, 42, 0.06);
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
  border-color: rgba(15, 23, 42, 0.26);
}

@keyframes selected-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(15, 23, 42, 0.18);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(15, 23, 42, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

@keyframes refresh-pulse-neutral {
  0% {
    box-shadow: 0 0 0 0 rgba(15, 23, 42, 0.16);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(15, 23, 42, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(15, 23, 42, 0);
  }
}

.refreshing-button-purple {
  background: #0f172a;
  color: white;
  animation: refresh-pulse-neutral 1.5s infinite;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.2);
}

.refreshing-button-green {
  background: #0f172a;
  color: white;
  animation: refresh-pulse-neutral 1.5s infinite;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.2);
}

.refreshing-button-pink {
  background: #0f172a;
  color: white;
  animation: refresh-pulse-neutral 1.5s infinite;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.2);
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
