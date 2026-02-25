<template>
  <div class="flex flex-col h-full min-h-0 bg-white dark:bg-gray-900">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-0 min-w-0">
      <!-- Barra resumida: una sola fila (estilo referencia jefe) -->
      <div class="flex items-center min-h-[72px] py-5 gap-2 flex-nowrap border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-5 shrink-0">
        
        
        <CalendarFilters
          v-if="showCalendarFilters"
          :responsables="responsablesForFilter"
          :contenedores="contenedores"
          :calendar-permissions="calendarPermissions"
          :current-user-id="Number(currentUserId) || null"
          :initial-filters="filters"
          :get-responsable-color="getResponsableColor"
          inline
          compact
          @filter-change="handleFilterChange"
        />
        <div class="flex items-center gap-1 ml-auto shrink-0">
          <UButton
            v-if="isJefeImportaciones"
            icon="i-heroicons-plus"
            color="primary"
            size="xs"
            label="Crear Actividad"
            class="hidden sm:inline-flex"
            @click="openCreateActivity"
          />
          <UButton
            icon="i-heroicons-chart-bar"
            variant="ghost"
            size="xs"
            label="Progreso"
            class="hidden sm:inline-flex"
            title="Ver Progreso"
            @click="navigateTo('/calendar/progreso')"
          />
          <UButton
            v-if="showCalendarFilters && calendarPermissions?.canAccessConfig"
            icon="i-heroicons-cog-6-tooth"
            variant="ghost"
            size="xs"
            class="!p-1.5"
            label="Configuración"
            @click="openConfig"
          />
        </div>
      </div>

      <!-- Progreso del equipo (solo para Jefe de Importaciones) -->
      <ProgressCards
        v-if="showProgress && viewMode === 'activities'"
        :team-progress="teamProgress"
        :responsable-progress="responsableProgress"
        :get-responsable-color="getResponsableColor"
      />

      <!-- Calendar Content (único scroll) -->
      <div class="flex-1 min-h-0 overflow-auto relative px-4 md:px-6 lg:px-8 py-4 w-9/10  mx-auto">
        <div v-if="error && !loading" class="text-center py-12">
          <p class="text-red-500">{{ error }}</p>
          <UButton label="Reintentar" @click="viewMode === 'activities' ? loadActivitiesData() : loadEvents()" class="mt-4" />
        </div>

        <!-- Vista de Actividades (tabla) -->
        <div v-if="viewMode === 'activities'" class="h-full relative">
          <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
            <CalendarSkeleton view-mode="activities" />
          </div>
          <div v-show="!loading" class="h-full">
            <ActivityTable
              :activities="visibleActivities"
              :calendar-permissions="calendarPermissions"
              :current-user-id="Number(currentUserId) || 0"
              :is-jefe="isJefeImportaciones"
              :get-responsable-color="getResponsableColor"
              @create="openActivityModal()"
              @edit="openActivityModal"
              @delete="handleDeleteActivity"
              @open-notes="openNotesModal"
              @update-status="handleUpdateStatus"
              @update-priority="handleUpdatePriority"
            />
          </div>
        </div>

        <!-- Transición para vistas de calendario -->
        <Transition
          v-else
          name="slide-fade"
          mode="out-in"
          @after-enter="onTransitionComplete"
        >
          <!-- Vista de Mes -->
          <div v-if="viewMode === 'month'" :key="`month-${currentDate.year}-${currentDate.month}`" class="h-full bg-white dark:bg-gray-800 relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading" class="pb-4">
      <!-- Título del mes (estilo referencia: grande, centrado, mayúsculas) -->
      <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wide text-center py-3 md:py-4">
        {{ currentPeriodTitle }}
      </h2>
      <!-- Días de la semana (fondo oscuro, texto blanco) -->
      <div class="grid grid-cols-7 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-800 dark:bg-gray-900">
        <div
          v-for="day in weekDays"
          :key="day"
          class="py-2.5 md:py-3 px-1 text-center text-xs md:text-sm font-bold text-white"
        >
          <span class="hidden sm:inline">{{ day }}</span>
          <span class="sm:hidden">{{ day.charAt(0) }}</span>
        </div>
      </div>

      <!-- Semanas del mes con eventos multi-día -->
      <div 
        v-for="(week, weekIndex) in calendarWeeks" 
        :key="weekIndex"
        class="relative"
      >
        <!-- Celdas de los días -->
        <div class="grid grid-cols-7 border-r-2 border-gray-300 dark:border-gray-600">
          <div
            v-for="(day, dayIndex) in week.days"
            :key="dayIndex"
            class="min-h-[145px] max-h-[180px] overflow-hidden transition-colors flex flex-col relative"
            :class="day.isCurrentMonth
              ? 'border-r-2 border-b-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ' +
                (day.isWeekend
                  ? 'bg-gray-100 dark:bg-gray-800/70'
                  : 'bg-white dark:bg-gray-800' + (day.isToday ? ' bg-blue-50 dark:bg-blue-900/10' : ''))
              : 'border-r-2 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 pointer-events-none'"
            @click="day.isCurrentMonth && handleDayClick(day.date)"
          >
            <div class="p-2 md:p-2.5 relative">
              <span
                class="text-sm font-medium"
                :class="{
                  'text-gray-900 dark:text-white': day.isCurrentMonth && !day.isToday,
                  'text-primary-600 dark:text-primary-400 font-bold': day.isCurrentMonth && day.isToday,
                  'text-gray-400 dark:text-gray-600': !day.isCurrentMonth
                }"
              >
                {{ day.day }}
              </span>
            </div>
            <!-- Ver más por día: solo si este día tiene más de 3 eventos -->
            <div
              v-if="day.isCurrentMonth && getEventsForDayInWeek(week, dayIndex).length > MAX_VISIBLE_EVENT_ROWS"
              class="mt-auto pt-1 px-1 pointer-events-auto"
              @click.stop
            >
              <button
                type="button"
                class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline focus:outline-none w-full text-left"
                @click.stop="openMoreEventsModal(getEventsForDayInWeek(week, dayIndex).slice(MAX_VISIBLE_EVENT_ROWS), `Más eventos - ${day.day} ${monthNames[day.date.month - 1]}`)"
              >
                Ver más (+{{ getEventsForDayInWeek(week, dayIndex).length - MAX_VISIBLE_EVENT_ROWS }}) eventos
              </button>
            </div>
          </div>
        </div>
        
        <!-- Eventos multi-día (capa absoluta). Máx 3 filas. z-20 para quedar sobre el overlay gris del fin de semana. -->
        <div class="absolute top-6 md:top-7 left-0 right-0 pointer-events-none z-20">
          <div
            v-for="(eventRow, rowIndex) in week.eventRows.slice(0, MAX_VISIBLE_EVENT_ROWS)"
            :key="rowIndex"
            class="relative h-6 md:h-7 mb-1"
          >
            <div
              v-for="eventSpan in eventRow"
              :key="`${eventSpan.event.id}-${eventSpan.startCol}`"
              class="absolute h-full flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity text-[11px] md:text-xs text-white font-medium overflow-hidden pointer-events-auto rounded shadow-sm px-1"
              :class="{
                'rounded-l-md': eventSpan.isStart,
                'rounded-r-md': eventSpan.isEnd,
              }"
              :style="getMultiDayEventStyle(eventSpan)"
              :title="(eventSpan.isStart ? '' : 'Continúa desde la semana anterior. ') + getEventTooltip(eventSpan.event)"
              @click.stop="openEditModal(eventSpan.event)"
            >
              <UTooltip v-if="!eventSpan.isStart" text="Continúa desde la semana anterior" class="shrink-0">
                <span class="flex items-center justify-center w-5 h-5 rounded bg-white/20 text-[10px] font-bold">…</span>
              </UTooltip>
              <span v-if="eventSpan.isStart" class="truncate flex items-center gap-1 min-w-0 flex-1">
                <UTooltip v-if="!isJefeImportaciones" :text="`Prioridad: ${PRIORITY_LABELS[eventSpan.event.priority ?? 0]}`">
                  <UIcon :name="getPriorityIcon(eventSpan.event.priority ?? 0)" class="w-3.5 h-3.5 shrink-0 opacity-90" />
                </UTooltip>
                <span class="truncate">{{ eventSpan.event.title || eventSpan.event.name }}</span>
                <span v-if="eventSpan.event.contenedor?.nombre" class="shrink-0 opacity-90 text-[10px] md:text-[11px]">
                  / {{ eventSpan.event.contenedor.nombre.replace(/^Consolidado\s*#?/i, '#') }}
                </span>
              </span>
              <div v-if="eventSpan.isEnd && getEventResponsables(eventSpan.event).length" class="flex items-center gap-0.5 shrink-0 ml-auto">
                <UTooltip
                  v-for="resp in getEventResponsables(eventSpan.event).slice(0, 2)"
                  :key="resp.id"
                  :text="resp.nombre"
                  :content="{
      align: 'center',
      side: 'top',
      sideOffset: 8
    }"
                >
                  <UAvatar
                    :src="resp.avatar || undefined"
                    :alt="resp.nombre"
                    size="3xs"
                    class="ring-1 ring-white/30 shrink-0"
                    :style="{ backgroundColor: getResponsableColor(resp.id, resp.nombre), color: '#fff' }"
                  />
                </UTooltip>
                <span
                  v-if="getEventResponsables(eventSpan.event).length > 2"
                  class="text-[9px] font-bold opacity-80"
                >+{{ getEventResponsables(eventSpan.event).length - 2 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
            </div>
    </div>

          <!-- Vista de Rango (varios meses según filtro de fechas) -->
          <div v-else-if="viewMode === 'range'" :key="`range-${filters?.start_date}-${filters?.end_date}`" class="h-full bg-white dark:bg-gray-800 relative overflow-auto">
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton view-mode="month" />
            </div>
            <div v-show="!loading" class="p-2 md:p-4 space-y-8 pb-6">
              <template v-for="(monthData, monthIndex) in rangeViewData" :key="`${monthData.year}-${monthData.month}`">
                <div class="min-w-0">
                  <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wide text-center py-3 md:py-4">
                    {{ monthData.title }}
                  </h3>
                  <div class="grid grid-cols-7 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-800 dark:bg-gray-900">
                    <div
                      v-for="day in weekDays"
                      :key="day"
                      class="py-2.5 md:py-3 px-1 text-center text-xs md:text-sm font-bold text-white"
                    >
                      <span class="hidden sm:inline">{{ day }}</span>
                      <span class="sm:hidden">{{ day.charAt(0) }}</span>
                    </div>
                  </div>
                  <div
                    v-for="(week, weekIndex) in monthData.weeks"
                    :key="`${monthIndex}-${weekIndex}`"
                    class="relative"
                  >
                    <div class="grid grid-cols-7">
                    <div
                      v-for="(day, dayIndex) in week.days"
                      :key="dayIndex"
                      class="min-h-[145px] max-h-[180px] overflow-hidden transition-colors flex flex-col relative"
                      :class="day.isCurrentMonth
                        ? 'border-r-2 border-b-2 border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ' +
                          (day.isWeekend
                            ? 'bg-gray-100 dark:bg-gray-800/70'
                            : 'bg-white dark:bg-gray-800' + (day.isToday ? ' bg-blue-50 dark:bg-blue-900/10' : ''))
                        : 'border-r-2 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 pointer-events-none'"
                      @click="day.isCurrentMonth && handleDayClick(day.date)"
                    >
                      <div class="p-2 md:p-2.5 relative">
                        <span
                          class="text-sm font-medium"
                          :class="{
                            'text-gray-900 dark:text-white': day.isCurrentMonth && !day.isToday,
                            'text-primary-600 dark:text-primary-400 font-bold': day.isCurrentMonth && day.isToday,
                            'text-gray-400 dark:text-gray-600': !day.isCurrentMonth
                          }"
                        >
                          {{ day.day }}
                        </span>
                      </div>
                      <!-- Ver más por día -->
                      <div
                        v-if="day.isCurrentMonth && getEventsForDayInWeek(week, dayIndex).length > MAX_VISIBLE_EVENT_ROWS"
                        class="mt-auto pt-1 px-1 pointer-events-auto"
                        @click.stop
                      >
                        <button
                          type="button"
                          class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline focus:outline-none w-full text-left"
                          @click.stop="openMoreEventsModal(getEventsForDayInWeek(week, dayIndex).slice(MAX_VISIBLE_EVENT_ROWS), `Más eventos - ${day.day} ${monthNames[day.date.month - 1]}`)"
                        >
                          Ver más (+{{ getEventsForDayInWeek(week, dayIndex).length - MAX_VISIBLE_EVENT_ROWS }}) eventos
                        </button>
                      </div>
                    </div>
                    </div>
                    <div class="absolute top-6 md:top-7 left-0 right-0 pointer-events-none z-20">
                      <div
                        v-for="(eventRow, rowIndex) in week.eventRows.slice(0, MAX_VISIBLE_EVENT_ROWS)"
                        :key="rowIndex"
                        class="relative h-6 md:h-7 mb-1"
                      >
                        <div
                          v-for="eventSpan in eventRow"
                          :key="`range-${monthIndex}-${weekIndex}-${rowIndex}-${eventSpan.event.id}-${eventSpan.startCol}`"
                          class="absolute h-full flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity text-[11px] md:text-xs text-white font-medium overflow-hidden pointer-events-auto rounded shadow-sm px-1"
                          :class="{
                            'rounded-l-md': eventSpan.isStart,
                            'rounded-r-md': eventSpan.isEnd,
                          }"
                          :style="getMultiDayEventStyle(eventSpan)"
                          :title="(eventSpan.isStart ? '' : 'Continúa desde la semana anterior. ') + getEventTooltip(eventSpan.event)"
                          @click.stop="openEditModal(eventSpan.event)"
                        >
                          <UTooltip v-if="!eventSpan.isStart" text="Continúa desde la semana anterior" class="shrink-0">
                            <span class="flex items-center justify-center w-5 h-5 rounded bg-white/20 text-[10px] font-bold">…</span>
                          </UTooltip>
                          <span v-if="eventSpan.isStart" class="truncate flex items-center gap-1 min-w-0 flex-1">
                            <UTooltip v-if="!isJefeImportaciones" :text="`Prioridad: ${PRIORITY_LABELS[eventSpan.event.priority ?? 0]}`">
                              <UIcon :name="getPriorityIcon(eventSpan.event.priority ?? 0)" class="w-3.5 h-3.5 shrink-0 opacity-90" />
                            </UTooltip>
                            <span class="truncate">{{ eventSpan.event.title || eventSpan.event.name }}</span>
                            <span v-if="eventSpan.event.contenedor?.nombre" class="shrink-0 opacity-90 text-[10px] md:text-[11px]">
                              / {{ eventSpan.event.contenedor.nombre.replace(/^Consolidado\s*#?/i, '#') }}
                            </span>
                          </span>
                          <div v-if="eventSpan.isEnd && getEventResponsables(eventSpan.event).length" class="flex items-center gap-0.5 shrink-0 ml-auto">
                            <UTooltip
                              v-for="resp in getEventResponsables(eventSpan.event).slice(0, 2)"
                              :key="resp.id"
                              :text="resp.nombre"
                              :content="{
      align: 'center',
      side: 'top',
      sideOffset: 8
    }"
              
                            >
                              <UAvatar
                                :src="resp.avatar || undefined"
                                :alt="resp.nombre"
                                size="3xs"
                                class="ring-1 ring-white/30 shrink-0"
                                :style="{ backgroundColor: getResponsableColor(resp.id, resp.nombre), color: '#fff' }"
                              />
                            </UTooltip>
                            <span
                              v-if="getEventResponsables(eventSpan.event).length > 2"
                              class="text-[9px] font-bold opacity-80"
                            >+{{ getEventResponsables(eventSpan.event).length - 2 }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <p v-if="rangeViewData.length === 0 && !loading" class="text-gray-500 dark:text-gray-400 text-center py-8">
                Selecciona un rango de fechas con meses diferentes en el filtro para ver esta vista.
              </p>
            </div>
          </div>

          <!-- Vista de Semana -->
          <div v-else-if="viewMode === 'week'" :key="`week-${currentDate.year}-${currentDate.month}-${currentDate.day}`" class="h-full bg-white dark:bg-gray-800 relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading">
      <div class="grid grid-cols-8 border-b-2 border-gray-300 dark:border-gray-600 overflow-x-auto">
        <div class="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"></div>
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="p-2 md:p-3 text-center border-l-2 border-gray-300 dark:border-gray-600 min-w-[80px] md:min-w-0 relative"
          :class="{
            'bg-primary-50 dark:bg-primary-900/20': day.isToday,
            'bg-gray-100 dark:bg-gray-800/70': day.isWeekend && !day.isToday,
            'bg-gray-50 dark:bg-gray-900': !day.isToday && !day.isWeekend
          }"
        >
          <div class="text-[10px] md:text-xs" :class="'text-gray-500 dark:text-gray-400'">{{ day.dayName }}</div>
          <div
            class="text-sm md:text-lg font-semibold"
            :class="{
              'text-primary-600 dark:text-primary-400': day.isToday,
              'text-gray-900 dark:text-white': !day.isToday
            }"
          >
            {{ day.day }}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-8 overflow-x-auto">
        <div class="border-r border-gray-200 dark:border-gray-700">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-12 md:h-16 border-b border-gray-200 dark:border-gray-700 p-1 md:p-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400"
          >
            <span class="hidden sm:inline">{{ hour }}</span>
            <span class="sm:hidden">{{ hour.split(':')[0] }}</span>
          </div>
        </div>
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="border-r-2 border-b-2 border-gray-300 dark:border-gray-600 relative min-w-[80px] md:min-w-0"
          :class="{ 'bg-gray-100 dark:bg-gray-800/70': day.isWeekend }"
        >
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-12 md:h-16 border-b border-gray-200 dark:border-gray-700"
          ></div>
          <div
            v-for="event in day.events.slice(0, MAX_VISIBLE_EVENT_ROWS)"
            :key="event.id"
            class="absolute left-0.5 md:left-1 right-0.5 md:right-1 text-[11px] md:text-xs px-2 py-1 rounded shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex flex-col gap-0.5"
            :style="{
              backgroundColor: getEventDisplayColor(event),
              color: '#ffffff',
              top: getEventTopPosition(event),
              height: getEventHeight(event)
            }"
            @click="openEditModal(event)"
            @dblclick="openEditModal(event)"
          >
            <div class="truncate font-medium flex items-center gap-1">
              <UTooltip v-if="!isJefeImportaciones" :text="`Prioridad: ${PRIORITY_LABELS[event.priority ?? 0]}`">
                <UIcon :name="getPriorityIcon(event.priority ?? 0)" class="w-3 h-3 shrink-0 opacity-90" />
              </UTooltip>
              {{ event.title || event.name }}
            </div>
            <div v-if="event.contenedor?.nombre" class="text-[10px] md:text-[11px] opacity-90 truncate">
              {{ event.contenedor.nombre }}
            </div>
            <div v-if="event.start_time" class="text-[10px] opacity-90">
              {{ formatTime(event.start_time) }}
            </div>
          </div>
          <!-- Al final de la lista del día: abrir modal con el resto (no redirigir) -->
          <div
            v-if="day.events.length > MAX_VISIBLE_EVENT_ROWS"
            class="absolute left-0.5 md:left-1 right-0.5 md:right-1 text-xs font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline py-0.5"
            :style="{ top: getVerMasTopPosition(day.events.slice(0, MAX_VISIBLE_EVENT_ROWS)) }"
            @click="openMoreEventsModal(day.events.slice(MAX_VISIBLE_EVENT_ROWS), `Más eventos - ${day.dayName} ${day.day}`)"
          >
            Ver más (+{{ day.events.length - MAX_VISIBLE_EVENT_ROWS }}) eventos
          </div>
        </div>
      </div>
            </div>
        </div>

          <!-- Vista de Día -->
          <div v-else-if="viewMode === 'day'" :key="`day-${currentDate.year}-${currentDate.month}-${currentDate.day}`" class="h-full bg-white dark:bg-gray-800 flex flex-col relative">
            <!-- Skeleton mientras carga -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white dark:bg-gray-900">
              <CalendarSkeleton :view-mode="viewMode" />
            </div>
            <!-- Contenido del calendario -->
            <div v-show="!loading" class="h-full flex flex-col">
          <!-- Header del día -->
          <div class="border-b border-gray-200 dark:border-gray-700 p-3 md:p-4 bg-gray-50 dark:bg-gray-900">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
                  {{ formatDayHeader(currentDate as CalendarDate) }}
                </h2>
                <p class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDaySubheader(currentDate as CalendarDate) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Horas del día -->
          <div class="flex-1 overflow-y-auto overflow-x-auto">
            <div class="grid grid-cols-12 min-w-[600px]">
              <!-- Columna de horas -->
              <div class="col-span-2 md:col-span-1 border-r border-gray-200 dark:border-gray-700">
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="h-12 md:h-16 border-b border-gray-200 dark:border-gray-700 p-1 md:p-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400"
                >
                  <span class="hidden sm:inline">{{ hour }}</span>
                  <span class="sm:hidden">{{ hour.split(':')[0] }}</span>
                </div>
              </div>

              <!-- Columna de eventos -->
              <div class="col-span-10 md:col-span-11 relative">
                <!-- Grid de horas -->
                <div
                  v-for="hour in hours"
                  :key="hour"
                  class="h-12 md:h-16 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  @click="handleHourClick(hour)"
                ></div>

                <!-- Eventos del día (máx 3 visibles + Ver más abre modal) -->
                <div
                  v-for="event in dayEvents.slice(0, MAX_VISIBLE_EVENT_ROWS)"
                  :key="event.id"
                  class="absolute left-1 md:left-2 right-1 md:right-2 text-[11px] md:text-xs px-2 py-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm flex flex-col gap-0.5"
                  :style="{
                    backgroundColor: getEventDisplayColor(event),
                    color: '#ffffff',
                    top: getEventTopPosition(event),
                    height: getEventHeight(event)
                  }"
                  @click="openEditModal(event)"
                  @dblclick="openEditModal(event)"
                >
                  <div class="font-medium truncate flex items-center gap-1">
                    <UTooltip v-if="!isJefeImportaciones" :text="`Prioridad: ${PRIORITY_LABELS[event.priority ?? 0]}`">
                      <UIcon :name="getPriorityIcon(event.priority ?? 0)" class="w-3 h-3 shrink-0 opacity-90" />
                    </UTooltip>
                    {{ event.title || event.name }}
                  </div>
                  <div v-if="event.contenedor?.nombre" class="text-[10px] opacity-90 truncate">
                    {{ event.contenedor.nombre }}
                  </div>
                  <div v-if="event.start_time && event.end_time" class="text-[10px] opacity-90">
                    {{ formatTime(event.start_time) }} - {{ formatTime(event.end_time) }}
                  </div>
                  <div v-else-if="event.start_time" class="text-[10px] opacity-90">
                    {{ formatTime(event.start_time) }}
                  </div>
              </div>
              <!-- Al final de la lista: abrir modal con el resto (no redirigir) -->
              <div
                v-if="dayEvents.length > MAX_VISIBLE_EVENT_ROWS"
                class="absolute left-1 md:left-2 right-1 md:right-2 text-xs font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline py-1.5"
                :style="{ top: getVerMasTopPosition(dayEvents.slice(0, MAX_VISIBLE_EVENT_ROWS)) }"
                @click="openMoreEventsModal(dayEvents.slice(MAX_VISIBLE_EVENT_ROWS), formatDayHeader(currentDate as CalendarDate))"
              >
                Ver más (+{{ dayEvents.length - MAX_VISIBLE_EVENT_ROWS }}) eventos
              </div>
            </div>
          </div>
            </div>
        </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <UModal :open="isDeleteModalOpen" @close="isDeleteModalOpen = false">
      <template #header>
        <h3 class="text-lg font-semibold">Confirmar eliminación</h3>
      </template>
      <template #body>
        <p>¿Estás seguro de que deseas eliminar "{{ selectedEvent?.title || selectedEvent?.name }}"?</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" variant="ghost" @click="isDeleteModalOpen = false" />
          <UButton 
            label="Eliminar" 
            color="error" 
            @click="viewMode === 'activities' ? confirmDeleteActivity() : confirmDelete()" 
            :loading="loading" 
          />
        </div>
      </template>
    </UModal>

    <!-- Modal de Notas -->
    <NotesModal
      v-if="isNotesModalOpen"
      :activity="selectedActivity"
      :current-user-id="Number(currentUserId) || 0"
      :calendar-permissions="calendarPermissions"
      :get-responsable-color="getResponsableColor"
      @save="handleSaveNotes"
      @close="closeNotesModal"
    />

    <!-- Modal: resto de eventos del día / semana (sin redirigir) -->
    <UModal v-model:open="showMoreEventsModal" @update:open="onMoreEventsModalOpenChange">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ moreEventsTitle }}</h3>
      </template>
      <template #body>
        <ul class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
          <li
            v-for="event in moreEventsList"
            :key="event.id"
            class="py-2.5 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
            @click="openEventFromMoreModal(event)"
          >
            <div
              class="w-3 h-3 rounded shrink-0"
              :style="{ backgroundColor: getEventDisplayColor(event) }"
            />
            <div class="min-w-0 flex-1">
              <span class="font-medium text-gray-900 dark:text-white truncate block">
                <span v-if="!isJefeImportaciones" class="text-[10px] text-gray-500 dark:text-gray-400 mr-1">{{ PRIORITY_LABELS[event.priority ?? 0] }} —</span>
                {{ event.title || event.name }}
              </span>
              <span v-if="event.contenedor?.nombre" class="text-xs text-gray-500 dark:text-gray-400 truncate block">{{ event.contenedor.nombre }}</span>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400 shrink-0" />
          </li>
        </ul>
        <p v-if="moreEventsList.length === 0" class="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No hay más eventos.</p>
      </template>
    </UModal>

    <!-- Modal: todos los responsables del evento -->
    <UModal :open="showResponsablesModal" @close="closeResponsablesModal">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Responsables — {{ responsablesModalEvent?.title || responsablesModalEvent?.name || 'Evento' }}
        </h3>
      </template>
      <template #body>
        <ul v-if="responsablesModalEvent" class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[50vh] overflow-y-auto">
          <li
            v-for="resp in getEventResponsables(responsablesModalEvent)"
            :key="resp.id"
            class="py-2.5 px-2 flex items-center gap-3"
          >
            <UAvatar
              :src="resp.avatar || undefined"
              :alt="resp.nombre"
              size="md"
              :style="{ backgroundColor: getResponsableColor(resp.id, resp.nombre), color: '#fff' }"
            />
            <span class="font-medium text-gray-900 dark:text-white">{{ resp.nombre }}</span>
          </li>
        </ul>
        <p v-if="responsablesModalEvent && getEventResponsables(responsablesModalEvent).length === 0" class="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">Sin responsables asignados.</p>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { CalendarDate, getLocalTimeZone, today, parseDate, isSameDay } from '@internationalized/date'
import { useCalendarStore } from '~/composables/useCalendarStore'
import { useModal } from '~/composables/commons/useModal'
import type { CalendarEvent, CreateEventRequest, UpdateEventRequest, CreateCalendarEventRequest, CalendarEventStatus, CalendarEventPriority } from '~/types/calendar'
import type { CalendarFilters as CalendarFiltersType } from '~/types/calendar'
import { PRIORITY_LABELS } from '~/types/calendar'
import { useOverlay } from '#imports'

const EventModal = defineAsyncComponent(() => import('~/components/calendar/EventModal.vue'))
const QuickCreateModal = defineAsyncComponent(() => import('~/components/calendar/QuickCreateModal.vue'))
// Skeleton se mantiene síncrono para mostrar estado de carga de inmediato
import CalendarSkeleton from '~/components/calendar/CalendarSkeleton.vue'
const CalendarFilters = defineAsyncComponent(() => import('~/components/calendar/CalendarFilters.vue'))
const ActivityTable = defineAsyncComponent(() => import('~/components/calendar/ActivityTable.vue'))
const ActivityModal = defineAsyncComponent(() => import('~/components/calendar/ActivityModal.vue'))
const NotesModal = defineAsyncComponent(() => import('~/components/calendar/NotesModal.vue'))
const ProgressCards = defineAsyncComponent(() => import('~/components/calendar/ProgressCards.vue'))
import { ROLES } from '~/constants/roles'
import { VIEW_OPTIONS } from '~/constants/calendar'

// Store unificado del calendario (con caché)
const {
  visibleEvents,
  visibleActivities,
  responsables,
  contenedores,
  colorConfig,
  activityCatalog,
  teamProgress,
  responsableProgress,
  loading,
  error,
  calendarPermissions,
  isJefeImportaciones,
  isCoordinacionOrDocumentacion,
  currentUserId,
  getEvents,
  createActivity,
  updateActivity,
  deleteActivity,
  createEvent,
  updateEvent,
  deleteEvent,
  updateChargeStatus,
  updateEventPriority,
  updateChargeNotes,
  updateEventNotes,
  loadResponsables,
  loadContenedores,
  loadColorConfig,
  loadActivityCatalog,
  createActivityInCatalog,
  updateActivityInCatalog,
  deleteActivityFromCatalog,
  loadProgress,
  getResponsableColor,
  getEventColors,
  getEventPosition,
  isEventOnDate,
  filters,
  setFilter,
  clearFilters,
  setDateRange,
  initialize: initializeStore
} = useCalendarStore()

const { showSuccess, showError } = useModal()

const route = useRoute()
const router = useRouter()

// Inicializar desde la ruta o valores por defecto
const initializeFromRoute = () => {
  // Intentar leer de params primero (rutas dinámicas)
  const yearParam = route.params.year ? parseInt(route.params.year as string) : (route.query.year ? parseInt(route.query.year as string) : null)
  const monthParam = route.params.month ? parseInt(route.params.month as string) : (route.query.month ? parseInt(route.query.month as string) : null)
  const dayParam = route.params.day ? parseInt(route.params.day as string) : (route.query.day ? parseInt(route.query.day as string) : null)
  const viewParam = route.query.view as string

  if (yearParam && monthParam && !isNaN(yearParam) && !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12) {
    if (dayParam && !isNaN(dayParam) && dayParam >= 1 && dayParam <= 31) {
      // Vista de día
      try {
        currentDate.value = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-${String(dayParam).padStart(2, '0')}`) as CalendarDate
        viewMode.value = 'day'
      } catch {
        currentDate.value = today(getLocalTimeZone())
        viewMode.value = 'month'
      }
    } else {
      // Vista de mes o semana
      try {
        currentDate.value = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-01`) as CalendarDate
        viewMode.value = (viewParam === 'week' ? 'week' : 'month') as 'month' | 'week' | 'day'
      } catch {
        currentDate.value = today(getLocalTimeZone())
        viewMode.value = 'month'
      }
    }
  } else {
    // Valores por defecto
    currentDate.value = today(getLocalTimeZone())
    viewMode.value = 'month'
  }
}

const viewMode = ref<'month' | 'week' | 'day' | 'activities' | 'range'>('month')

// Estado para modales de actividades
const isNotesModalOpen = ref(false)
const selectedActivity = ref<CalendarEvent | null>(null)
const activityModalLoading = ref(false)

// Verificar si mostrar filtros (para roles con permisos de calendario)
const showCalendarFilters = computed(() => {
  return isJefeImportaciones.value || isCoordinacionOrDocumentacion.value
})

// Para el filtro de responsable: jefe ve todos; quien no es jefe solo ve "Todos" y "Yo" (él mismo)
const responsablesForFilter = computed(() => {
  if (isJefeImportaciones.value) return responsables.value
  const uid = Number(currentUserId.value) || 0
  const me = responsables.value.find(r => r.id === uid)
  return me ? [me] : []
})

// Verificar si mostrar progreso
const showProgress = computed(() => {
  return isJefeImportaciones.value && calendarPermissions.value.canViewTeamProgress
})
const currentDate = ref<CalendarDate>(today(getLocalTimeZone()))
const isDeleteModalOpen = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const pendingLoadEvents = ref(false)

// Modal "Más eventos" (sin redirigir a otra vista)
const showMoreEventsModal = ref(false)
const moreEventsList = ref<CalendarEvent[]>([])
const moreEventsTitle = ref('')
const openMoreEventsModal = (events: CalendarEvent[], title: string) => {
  moreEventsList.value = events
  moreEventsTitle.value = title
  showMoreEventsModal.value = true
}

// Modal de responsables (cuando hay más de 2 en la barra)
const showResponsablesModal = ref(false)
const responsablesModalEvent = ref<CalendarEvent | null>(null)
const openResponsablesModal = (event: CalendarEvent) => {
  responsablesModalEvent.value = event
  showResponsablesModal.value = true
}
const closeResponsablesModal = () => {
  showResponsablesModal.value = false
  responsablesModalEvent.value = null
}
const closeMoreEventsModal = () => {
  showMoreEventsModal.value = false
  moreEventsList.value = []
  moreEventsTitle.value = ''
}
const onMoreEventsModalOpenChange = (open: boolean) => {
  if (!open) {
    moreEventsList.value = []
    moreEventsTitle.value = ''
  }
}
const openEventFromMoreModal = (event: CalendarEvent) => {
  closeMoreEventsModal()
  openEditModal(event)
}
// Eventos que tocan un día concreto dentro de una semana (por columna 0-6)
const getEventsForDayInWeek = (week: { days: any[], eventRows: EventSpan[][] }, dayIndex: number): CalendarEvent[] => {
  const byId = new Map<number, CalendarEvent>()
  week.eventRows.forEach(row => {
    row.forEach(span => {
      if (span.startCol <= dayIndex && dayIndex <= span.endCol) {
        byId.set(span.event.id, span.event)
      }
    })
  })
  return Array.from(byId.values())
}

// Opciones de vista (incluye 'Rango' cuando hay fechas de meses distintos y 'activities' para Jefe/Coord)
const viewOptions = computed(() => {
  const options = [
    { label: 'Día', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' }
  ]
  const start = filters.value?.start_date
  const end = filters.value?.end_date
  if (start && end) {
    const [sy, sm] = start.split('-').map(Number)
    const [ey, em] = end.split('-').map(Number)
    if (sy !== ey || sm !== em) {
      options.push({ label: 'Rango', value: 'range' })
    }
  }
  if (isJefeImportaciones.value || isCoordinacionOrDocumentacion.value) {
    options.push({ label: 'Actividades', value: 'activities' })
  }
  return options
})

const handleViewModeChange = (value: 'month' | 'week' | 'day' | 'activities' | 'range') => {
  viewMode.value = value
  updateUrl()
  if (value === 'activities') {
    loadActivitiesData()
  } else if (value === 'range') {
    loadEventsWithRange()
  } else {
    pendingLoadEvents.value = true
  }
}

// Cargar datos de actividades (force = true tras crear/editar para evitar caché)
const loadActivitiesData = async (force = false) => {
  await getEvents(undefined, force)
  if (calendarPermissions.value.canViewTeamProgress) {
    await loadProgress()
  }
}

// Handlers para filtros
const handleFilterChange = async (newFilters: any) => {
  // Actualizar responsable(s): múltiple (jefe) o único
  if ('responsable_ids' in newFilters) {
    setFilter('responsable_ids', newFilters.responsable_ids ?? undefined)
    setFilter('responsable_id', undefined)
  } else if ('responsable_id' in newFilters) {
    setFilter('responsable_id', newFilters.responsable_id)
    setFilter('responsable_ids', undefined)
  }
  if ('contenedor_ids' in newFilters) {
    setFilter('contenedor_ids', newFilters.contenedor_ids ?? undefined)
    setFilter('contenedor_id', undefined)
  } else if ('contenedor_id' in newFilters) {
    setFilter('contenedor_id', newFilters.contenedor_id)
    setFilter('contenedor_ids', undefined)
  }
  if (newFilters.start_date !== undefined || newFilters.end_date !== undefined) {
    setDateRange(newFilters.start_date || '', newFilters.end_date || '')
    const start = newFilters.start_date
    const end = newFilters.end_date
    if (start && end) {
      const [sy, sm] = start.split('-').map(Number)
      const [ey, em] = end.split('-').map(Number)
      if (sy !== ey || sm !== em) {
        viewMode.value = 'range'
      } else {
        // Mismo mes: vista normal de mes
        viewMode.value = 'month'
        currentDate.value = parseDate(`${sy}-${String(sm).padStart(2, '0')}-01`) as CalendarDate
        updateUrl()
      }
    }
  }
  // Construir payload: responsable_ids (varios) o responsable_id (uno); "Todos" = no enviar
  const payload: Record<string, unknown> = { ...filters.value }
  if (newFilters.contenedor_ids !== undefined) {
    payload.contenedor_ids = Array.isArray(newFilters.contenedor_ids) ? newFilters.contenedor_ids : undefined
  }
  if ('responsable_ids' in newFilters) {
    payload.responsable_ids = Array.isArray(newFilters.responsable_ids) && newFilters.responsable_ids.length
      ? newFilters.responsable_ids
      : undefined
    delete payload.responsable_id
  } else if ('responsable_id' in newFilters) {
    const rid = newFilters.responsable_id ?? undefined
    if (rid !== undefined && rid !== null) {
      payload.responsable_id = rid
    } else {
      delete payload.responsable_id
    }
    delete payload.responsable_ids
  }
  await getEvents(payload as CalendarFiltersType, true)
  if (calendarPermissions.value.canViewTeamProgress) {
    await loadProgress()
  }
}

// Handlers para actividades: abrir modal de actividad vía overlay
const openActivityModal = (activity?: CalendarEvent) => {
  if (!activity && !isJefeImportaciones.value) {
    showError('Sin permisos', 'Solo el Jefe de Importaciones puede crear actividades.')
    return
  }
  selectedActivity.value = activity || null
  activityModalOpenKey.value++
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: activity ?? null,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    initialDate: dateStr,
    onSave: async (data: CreateCalendarEventRequest) => {
      if (activity?.id) {
        await handleUpdateActivityOverlay({ ...data, id: activity.id })
      } else {
        await handleSaveActivityOverlay(data)
      }
    },
    onCreateActivity: async (name: string) => {
      return await createActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onUpdateActivity: async (id: number, name: string) => updateActivityInCatalog(id, name),
    onDelete: activity
      ? async () => {
          selectedEvent.value = activity
          isDeleteModalOpen.value = true
          activityModal.close()
        }
      : undefined,
    onClose: () => {
      activityModal.close()
      selectedActivity.value = null
    }
  })
}

const handleSaveActivity = async (data: CreateCalendarEventRequest) => {
  activityModalLoading.value = true
  try {
    if (selectedActivity.value?.id) {
      // Actualizar
      const result = await updateActivity({ id: selectedActivity.value.id, ...data })
      if (result) {
        showSuccess('Actividad actualizada', 'La actividad se ha actualizado correctamente.')
        activityModal.close()
        await loadActivitiesData()
        await loadProgress(true)
      } else {
        showError('Error', 'No se pudo actualizar la actividad.')
      }
    } else {
      // Verificar permisos para crear
      if (!isJefeImportaciones.value) {
        showError('Sin permisos', 'Solo el Jefe de Importaciones puede crear actividades.')
        return
      }
      // Crear
      const result = await createActivity(data)
      if (result) {
        showSuccess('Actividad creada', 'La actividad se ha creado correctamente.')
        activityModal.close()
        await loadActivitiesData()
        await loadProgress(true)
      } else {
        showError('Error', 'No se pudo crear la actividad.')
      }
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al guardar la actividad.')
  } finally {
    activityModalLoading.value = false
  }
}

const handleDeleteActivity = async (activity: CalendarEvent) => {
  if (!activity.id) return
  selectedEvent.value = activity as any
  isDeleteModalOpen.value = true
}

/** Eliminar actividad del catálogo desde el modal (no borra eventos del calendario) */
const onDeleteFromCatalog = async (catalogActivityId: number) => {
  try {
    const success = await deleteActivityFromCatalog(catalogActivityId)
    if (success) {
      showSuccess('Eliminada del catálogo', 'La actividad se ha eliminado del catálogo. Los eventos ya creados no se modifican.')
      activityModal.close()
      await loadActivityCatalog()
    } else {
      showError('Error', 'No se pudo eliminar del catálogo (puede estar en uso en algún evento).')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al eliminar del catálogo.')
  }
}

/** Mismo flujo para cuando el modal se abre por overlay (actualiza el dropdown sin cerrar el modal) */
const onDeleteFromCatalogOverlay = async (catalogActivityId: number) => {
  try {
    const success = await deleteActivityFromCatalog(catalogActivityId)
    if (success) {
      showSuccess('Eliminada del catálogo', 'La actividad se ha eliminado del catálogo. Los eventos ya creados no se modifican.')
      await loadActivityCatalog()
      // Actualizar las actividades predefinidas en el modal abierto para refrescar el dropdown
      activityModal.patch({
        actividadesPredefinidas: activityCatalog.value
      })
    } else {
      showError('Error', 'No se pudo eliminar del catálogo (puede estar en uso en algún evento).')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al eliminar del catálogo.')
  }
}

const confirmDeleteActivity = async () => {
  if (!selectedEvent.value?.id) return
  try {
    const success = await deleteActivity(selectedEvent.value.id)
    if (success) {
      showSuccess('Actividad eliminada', 'La actividad se ha eliminado correctamente.')
      isDeleteModalOpen.value = false
      selectedEvent.value = null
      await loadActivitiesData()
    } else {
      showError('Error', 'No se pudo eliminar la actividad.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al eliminar la actividad.')
  }
}

// Handler para estado
const handleUpdateStatus = async (chargeId: number, status: CalendarEventStatus) => {
  const success = await updateChargeStatus(chargeId, status)
  if (success) {
    showSuccess('Estado actualizado', 'El estado se ha actualizado correctamente.')
    await loadProgress(true)
  } else {
    showError('Error', 'No se pudo actualizar el estado.')
  }
}

// Handler para prioridad
const handleUpdatePriority = async (activityId: number, priority: CalendarEventPriority) => {
  const success = await updateEventPriority(activityId, priority)
  if (success) {
    showSuccess('Prioridad actualizada', 'La prioridad se ha actualizado correctamente.')
  } else {
    showError('Error', 'No se pudo actualizar la prioridad.')
  }
}

// Handlers para notas
const openNotesModal = (activity: CalendarEvent) => {
  selectedActivity.value = activity
  isNotesModalOpen.value = true
}

const closeNotesModal = () => {
  isNotesModalOpen.value = false
  selectedActivity.value = null
}

const handleSaveNotes = async (data: { activityNotes: string; chargeNotes: Record<number, string> }) => {
  if (!selectedActivity.value?.id) return
  try {
    // Guardar notas de la actividad
    await updateEventNotes(selectedActivity.value.id, data.activityNotes)
    // Guardar notas de cada charge
    for (const [chargeIdStr, notes] of Object.entries(data.chargeNotes)) {
      const chargeId = parseInt(chargeIdStr)
      const originalNotes = selectedActivity.value.charges?.find(c => c.id === chargeId)?.notes || ''
      if (notes !== originalNotes) {
        await updateChargeNotes(chargeId, notes)
      }
    }
    showSuccess('Notas guardadas', 'Las notas se han guardado correctamente.')
    closeNotesModal()
    await loadActivitiesData()
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al guardar las notas.')
  }
}

// Navegar a configuración
const openConfig = () => {
  navigateTo('/calendar/config')
}

// Inicializar desde la ruta
initializeFromRoute()

// Semana empieza en lunes (col 0 = Lunes, col 6 = Domingo)
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAX_VISIBLE_EVENT_ROWS = 3
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const overlay = useOverlay()
const eventModal = overlay.create(EventModal)
const quickCreateModal = overlay.create(QuickCreateModal)
const activityModal = overlay.create(ActivityModal)
const activityModalOpenKey = ref(0)
const currentMonthYear = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${months[currentDate.value.month - 1]} ${currentDate.value.year}`
})

const currentPeriodTitle = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  if (viewMode.value === 'range' && filters.value?.start_date && filters.value?.end_date) {
    const [sy, sm, sd] = filters.value.start_date.split('-').map(Number)
    const [ey, em, ed] = filters.value.end_date.split('-').map(Number)
    return `${sd} ${months[sm - 1]} ${sy} - ${ed} ${months[em - 1]} ${ey}`
  }
  if (viewMode.value === 'day') {
    try {
      // Calcular el día de la semana usando una fecha JavaScript
      const jsDate = new Date(currentDate.value.year, currentDate.value.month - 1, currentDate.value.day)
      const dayOfWeek = jsDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
      const dayName = days[dayOfWeek] || days[0] // Fallback a Domingo si hay error
      return `${dayName}, ${currentDate.value.day} de ${months[currentDate.value.month - 1]}`
    } catch {
      return `${currentDate.value.day} de ${months[currentDate.value.month - 1]}`
    }
  } else if (viewMode.value === 'week') {
    const y = currentDate.value.year
    const m = currentDate.value.month
    const d = currentDate.value.day
    const currentDay = parseDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    const mondayOffset = getMondayBasedWeekday(y, m, d)
    const monday = currentDay.subtract({ days: mondayOffset })
    const sunday = monday.add({ days: 6 })
    if (monday.month === sunday.month) {
      return `${monday.day} - ${sunday.day} de ${months[monday.month - 1]} ${monday.year}`
    } else {
      return `${monday.day} de ${months[monday.month - 1]} - ${sunday.day} de ${months[sunday.month - 1]} ${monday.year}`
    }
  } else {
    return `${months[currentDate.value.month - 1]} ${currentDate.value.year}`
  }
})

const currentPeriodTitleShort = computed(() => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  if (viewMode.value === 'range' && filters.value?.start_date && filters.value?.end_date) {
    const [, sm, sd] = filters.value.start_date.split('-').map(Number)
    const [, em, ed] = filters.value.end_date.split('-').map(Number)
    return `${sd}/${sm} - ${ed}/${em}`
  }
  if (viewMode.value === 'day') {
    try {
      const jsDate = new Date(currentDate.value.year, currentDate.value.month - 1, currentDate.value.day)
      const dayOfWeek = jsDate.getDay()
      const dayName = days[dayOfWeek] || days[0]
      return `${dayName} ${currentDate.value.day}/${currentDate.value.month}`
    } catch {
      return `${currentDate.value.day}/${currentDate.value.month}`
    }
  } else if (viewMode.value === 'week') {
    const y = currentDate.value.year
    const m = currentDate.value.month
    const d = currentDate.value.day
    const currentDay = parseDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    const mondayOffset = getMondayBasedWeekday(y, m, d)
    const monday = currentDay.subtract({ days: mondayOffset })
    const sunday = monday.add({ days: 6 })
    if (monday.month === sunday.month) {
      return `${monday.day}-${sunday.day} ${months[monday.month - 1]}`
    } else {
      return `${monday.day} ${months[monday.month - 1]}-${sunday.day} ${months[sunday.month - 1]}`
    }
  } else {
    return `${months[currentDate.value.month - 1]} ${currentDate.value.year}`
  }
})

// Helper para formatear fecha a string
const formatDateToStr = (date: CalendarDate): string => {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

// Día de la semana con lunes=0, domingo=6 (igual que columnas del grid)
const getMondayBasedWeekday = (year: number, month: number, day: number) => {
  const jsDay = new Date(year, month - 1, day).getDay() // 0=dom, 1=lun, ..., 6=sáb
  return (jsDay + 6) % 7 // 0=lun, ..., 6=dom
}

// Fin de semana (sábado/domingo). CalendarDate no tiene dayOfWeek; usamos Date.getDay() (0=dom, 6=sáb)
const isDateWeekend = (d: CalendarDate) => {
  const day = new Date(d.year, d.month - 1, d.day).getDay()
  return day === 0 || day === 6
}

// Calcular días del mes para la vista mensual
const calendarDays = computed(() => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const firstDay = parseDate(`${year}-${String(month).padStart(2, '0')}-01`)
  const lastDay = firstDay.set({ day: firstDay.calendar.getDaysInMonth(firstDay) })
  const startDayMonday = getMondayBasedWeekday(year, month, 1)
  const days: any[] = []
  const prevMonth = firstDay.subtract({ months: 1 })
  const daysInPrevMonth = prevMonth.calendar.getDaysInMonth(prevMonth)

  for (let i = startDayMonday - 1; i >= 0; i--) {
    const day = prevMonth.set({ day: daysInPrevMonth - i })
    const dateStr = formatDateToStr(day as CalendarDate)
    days.push({
      day: day.day,
      date: day,
      dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(day, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(day),
      events: getEventsForDate(day)
    })
  }

  for (let day = 1; day <= lastDay.day; day++) {
    const date = parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    const dateStr = formatDateToStr(date as CalendarDate)
    days.push({
      day: day,
      date: date,
      dateStr,
      isCurrentMonth: true,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(date),
      events: getEventsForDate(date)
    })
  }

  const remainingDays = (7 - (days.length % 7)) % 7
  const nextMonth = lastDay.add({ days: 1 })
  for (let day = 1; day <= remainingDays; day++) {
    const date = nextMonth.set({ day: day })
    const dateStr = formatDateToStr(date as CalendarDate)
    days.push({
      day: date.day,
      date: date,
      dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(date),
      events: getEventsForDate(date)
    })
  }
  
  return days
})

// Interface para eventos en semana
interface EventSpan {
  event: CalendarEvent
  startCol: number
  endCol: number
  isStart: boolean
  isEnd: boolean
}

// Columnas 0 = Lunes … 5 = Sábado, 6 = Domingo.
// Solo muestra el evento en sáb/dom si el evento cae exclusivamente en fin de semana; si va de jueves a lunes, solo jueves, viernes y lunes.
const getWeekdaySegments = (
  startCol: number,
  endCol: number,
  weekDays: { dateStr: string }[],
  event: { start_date?: string, end_date?: string }
): { startCol: number, endCol: number }[] => {
  if (startCol > endCol || !event.start_date || !event.end_date) return []
  const isWeekendDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const day = new Date(y, m - 1, d).getDay() // 0 = Domingo, 6 = Sábado
    return day === 0 || day === 6
  }
  const eventOnlyWeekend = isWeekendDate(event.start_date) && isWeekendDate(event.end_date)
  const includeCol = (col: number) => {
    const inRange = weekDays[col]?.dateStr >= event.start_date && weekDays[col]?.dateStr <= event.end_date
    if (!inRange) return false
    if (col <= 4) return true // Lunes–Viernes siempre
    return eventOnlyWeekend // Sáb/Dom solo si el evento es solo fin de semana
  }
  const segments: { startCol: number, endCol: number }[] = []
  let segStart: number | null = null
  for (let col = startCol; col <= endCol; col++) {
    if (includeCol(col)) {
      if (segStart === null) segStart = col
    } else {
      if (segStart !== null) {
        segments.push({ startCol: segStart, endCol: col - 1 })
        segStart = null
      }
    }
  }
  if (segStart !== null) segments.push({ startCol: segStart, endCol })
  return segments
}

// Agrupar días por semanas y calcular posiciones de eventos multi-día
const calendarWeeks = computed(() => {
  const days = calendarDays.value
  const weeks: { days: any[], eventRows: EventSpan[][] }[] = []
  
  // Dividir días en semanas de 7
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    const weekStartDate = weekDays[0].dateStr
    const weekEndDate = weekDays[6].dateStr
    
    // Encontrar todos los eventos que tocan esta semana
    const weekEvents = visibleEvents.value.filter(event => {
      const eventStart = event.start_date
      const eventEnd = event.end_date
      if (!eventStart || !eventEnd) return false
      // El evento toca la semana si: empieza antes del fin de semana Y termina después del inicio de semana
      return eventStart <= weekEndDate && eventEnd >= weekStartDate
    })
    
    // Organizar eventos en filas sin solapamiento
    const eventRows: EventSpan[][] = []
    const processedEvents = new Set<number>()
    
    weekEvents.forEach(event => {
      if (processedEvents.has(event.id)) return
      processedEvents.add(event.id)
      
      // Calcular columnas de inicio y fin dentro de la semana
      let startCol = 0
      let endCol = 6
      
      for (let col = 0; col < 7; col++) {
        const dayDate = weekDays[col].dateStr
        if (event.start_date === dayDate) startCol = col
        if (event.start_date > dayDate && col === 0) startCol = 0
        if (event.start_date < weekStartDate) startCol = 0
        
        if (event.end_date === dayDate) endCol = col
        if (event.end_date < dayDate && col === 6) endCol = 6
        if (event.end_date > weekEndDate) endCol = 6
      }
      
      // Ajustar startCol y endCol
      for (let col = 0; col < 7; col++) {
        const dayDate = weekDays[col].dateStr
        if (dayDate >= event.start_date && startCol > col) startCol = col
        if (dayDate <= event.end_date) endCol = col
      }
      
      const segments = getWeekdaySegments(startCol, endCol, weekDays, event)
      const origIsStart = event.start_date >= weekStartDate && event.start_date <= weekEndDate
      const origIsEnd = event.end_date >= weekStartDate && event.end_date <= weekEndDate
      
      segments.forEach((seg, segIdx) => {
        const span: EventSpan = {
          event,
          startCol: seg.startCol,
          endCol: seg.endCol,
          isStart: origIsStart && segIdx === 0,
          isEnd: origIsEnd && segIdx === segments.length - 1
        }
        let placed = false
        for (const row of eventRows) {
          const hasConflict = row.some((existing: EventSpan) =>
            !(span.endCol < existing.startCol || span.startCol > existing.endCol)
          )
          if (!hasConflict) {
            row.push(span)
            placed = true
            break
          }
        }
        if (!placed) {
          eventRows.push([span])
        }
      })
    })
    
    weeks.push({ days: weekDays, eventRows })
  }
  
  return weeks
})

// Tooltip para evento (título + consolidado)
const getEventTooltip = (event: CalendarEvent) => {
  const title = event.title || event.name
  const consolidado = event.contenedor?.nombre
  return consolidado ? `${title} — ${consolidado}` : title
}

// Responsables del evento (desde charges o responsables)
const getEventResponsables = (event: CalendarEvent) => {
  if (event.responsables?.length) return event.responsables
  const fromCharges = (event.charges || [])
    .map(c => c.user)
    .filter((u): u is NonNullable<typeof u> => !!u)
  return fromCharges.length ? fromCharges : []
}

// Color de evento según rol: Jefe → responsables; otros → prioridad
const getEventDisplayColor = (event: CalendarEvent) => {
  return getEventColors(event, { usePriority: !isJefeImportaciones.value })[0]
}

// Indicador de prioridad (icono) para perfiles no-Jefe
const getPriorityIcon = (priority: CalendarEventPriority) => {
  switch (priority) {
    case 2: return 'i-heroicons-exclamation-triangle'
    case 1: return 'i-heroicons-minus-circle'
    default: return 'i-heroicons-check-circle'
  }
}

// Estilo para eventos multi-día
const getMultiDayEventStyle = (span: EventSpan) => {
  const colors = getEventColors(span.event, { usePriority: !isJefeImportaciones.value })
  
  let background: string
  if (colors.length === 1) {
    background = colors[0]
  } else if (colors.length === 2) {
    // Gradiente diagonal (de arriba-izquierda a abajo-derecha)
    background = `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
  } else {
    // Múltiples colores en diagonal
    const stops = colors.map((color, i) => {
      const start = (i / colors.length) * 100
      const end = ((i + 1) / colors.length) * 100
      return `${color} ${start}%, ${color} ${end}%`
    }).join(', ')
    background = `linear-gradient(135deg, ${stops})`
  }
  
  const colWidth = 100 / 7
  const left = span.startCol * colWidth
  const width = (span.endCol - span.startCol + 1) * colWidth
  
  return {
    background,
    left: `calc(${left}% + 2px)`,
    width: `calc(${width}% - 4px)`,
  }
}

// Spans de una fila que muestran avatares (evento termina en semana y tiene responsables)
const getAvatarSpansInRow = (eventRow: EventSpan[]) =>
  eventRow.filter(span => span.isEnd && getEventResponsables(span.event).length > 0)

// Responsables únicos de toda la fila (sin duplicados)
const getUniqueResponsablesInRow = (eventRow: EventSpan[]) => {
  const seen = new Set<number>()
  const unique: ReturnType<typeof getEventResponsables> = []
  for (const span of eventRow) {
    for (const resp of getEventResponsables(span.event)) {
      if (!seen.has(resp.id)) {
        seen.add(resp.id)
        unique.push(resp)
      }
    }
  }
  return unique
}

// Días de un mes para la vista de rango (semana empieza lunes)
const getCalendarDaysForMonth = (year: number, month: number) => {
  const firstDay = parseDate(`${year}-${String(month).padStart(2, '0')}-01`)
  const lastDay = firstDay.set({ day: firstDay.calendar.getDaysInMonth(firstDay) })
  const startDayMonday = getMondayBasedWeekday(year, month, 1)
  const prevMonth = firstDay.subtract({ months: 1 })
  const daysInPrevMonth = prevMonth.calendar.getDaysInMonth(prevMonth)
  const days: any[] = []

  for (let i = startDayMonday - 1; i >= 0; i--) {
    const day = prevMonth.set({ day: daysInPrevMonth - i })
    const dateStr = formatDateToStr(day as CalendarDate)
    days.push({
      day: day.day,
      date: day,
      dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(day, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(day),
      events: getEventsForDate(day)
    })
  }

  for (let day = 1; day <= lastDay.day; day++) {
    const date = parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    const dateStr = formatDateToStr(date as CalendarDate)
    days.push({
      day: day,
      date: date,
      dateStr,
      isCurrentMonth: true,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(date),
      events: getEventsForDate(date)
    })
  }

  const remainingDays = (7 - (days.length % 7)) % 7
  const nextMonth = lastDay.add({ days: 1 })
  for (let day = 1; day <= remainingDays; day++) {
    const date = nextMonth.set({ day: day })
    const dateStr = formatDateToStr(date as CalendarDate)
    days.push({
      day: date.day,
      date: date,
      dateStr,
      isCurrentMonth: false,
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isWeekend: isDateWeekend(date),
      events: getEventsForDate(date)
    })
  }
  return days
}

// Semanas de un mes para la vista de rango (misma estructura que calendarWeeks).
// Solo muestra eventos en columnas que pertenecen al mes actual (no repite eventos del mes anterior al inicio).
const getCalendarWeeksForMonth = (year: number, month: number) => {
  const days = getCalendarDaysForMonth(year, month)
  const weeks: { days: any[], eventRows: EventSpan[][] }[] = []

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    const weekStartDate = weekDays[0].dateStr
    const weekEndDate = weekDays[6].dateStr

    // Columnas que pertenecen al mes que estamos mostrando (year, month)
    const currentMonthCols: number[] = []
    for (let c = 0; c < 7; c++) {
      const d = weekDays[c]
      if (d.date?.year === year && d.date?.month === month) currentMonthCols.push(c)
    }

    const weekEvents = visibleEvents.value.filter(event => {
      const eventStart = event.start_date
      const eventEnd = event.end_date
      if (!eventStart || !eventEnd) return false
      return eventStart <= weekEndDate && eventEnd >= weekStartDate
    })

    const eventRows: EventSpan[][] = []
    const processedEvents = new Set<number>()

    weekEvents.forEach(event => {
      if (processedEvents.has(event.id)) return
      processedEvents.add(event.id)

      let startCol = 0
      let endCol = 6
      for (let col = 0; col < 7; col++) {
        const dayDate = weekDays[col].dateStr
        if (event.start_date === dayDate) startCol = col
        if (event.start_date > dayDate && col === 0) startCol = 0
        if (event.start_date < weekStartDate) startCol = 0
        if (event.end_date === dayDate) endCol = col
        if (event.end_date < dayDate && col === 6) endCol = 6
        if (event.end_date > weekEndDate) endCol = 6
      }
      for (let col = 0; col < 7; col++) {
        const dayDate = weekDays[col].dateStr
        if (dayDate >= event.start_date && startCol > col) startCol = col
        if (dayDate <= event.end_date) endCol = col
      }

      // Aplicar lógica fin de semana: no mostrar en sáb/dom salvo que el evento sea solo fin de semana
      const segments = getWeekdaySegments(startCol, endCol, weekDays, event)
      // En vista de rango: recortar cada segmento al mes actual
      for (const seg of segments) {
        const clipStart = currentMonthCols.find(c => c >= seg.startCol && c <= seg.endCol)
        const clipEnd = currentMonthCols.length ? [...currentMonthCols].reverse().find(c => c >= seg.startCol && c <= seg.endCol) : undefined
        if (clipStart === undefined || clipEnd === undefined) continue

        const dayDateStart = weekDays[clipStart].dateStr
        const dayDateEnd = weekDays[clipEnd].dateStr
        const origIsStart = event.start_date >= dayDateStart && event.start_date <= dayDateEnd
        const origIsEnd = event.end_date >= dayDateStart && event.end_date <= dayDateEnd

        const span: EventSpan = {
          event,
          startCol: clipStart,
          endCol: clipEnd,
          isStart: origIsStart,
          isEnd: origIsEnd
        }
        let placed = false
        for (const row of eventRows) {
          const hasConflict = row.some((existing: EventSpan) =>
            !(span.endCol < existing.startCol || span.startCol > existing.endCol)
          )
          if (!hasConflict) {
            row.push(span)
            placed = true
            break
          }
        }
        if (!placed) {
          eventRows.push([span])
        }
      }
    })

    weeks.push({ days: weekDays, eventRows })
  }
  return weeks
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// Datos para la vista de rango: array de meses con sus semanas
const rangeViewData = computed(() => {
  if (viewMode.value !== 'range') return []
  const start = filters.value?.start_date
  const end = filters.value?.end_date
  if (!start || !end) return []
  const [startYear, startMonth] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)
  const result: { year: number, month: number, title: string, weeks: { days: any[], eventRows: EventSpan[][] }[] }[] = []
  let y = startYear
  let m = startMonth
  while (y < endYear || (y === endYear && m <= endMonth)) {
    result.push({
      year: y,
      month: m,
      title: `${monthNames[m - 1]} ${y}`,
      weeks: getCalendarWeeksForMonth(y, m)
    })
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return result
})

// Calcular días de la semana para la vista semanal
const weekDaysData = computed(() => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const day = currentDate.value.day
  
  // Obtener el lunes de la semana actual
  const currentDay = parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  const dayOfWeek = (currentDay as any).dayOfWeek % 7
  const monday = currentDay.subtract({ days: dayOfWeek === 0 ? 6 : dayOfWeek - 1 })
  
  const days: any[] = []
  for (let i = 0; i < 7; i++) {
    const date = monday.add({ days: i })
    const dow = (date as any).dayOfWeek % 7
    const isWeekend = dow === 0 || dow === 6
    const dowMonFirst = dow === 0 ? 6 : dow - 1
    days.push({
      day: date.day,
      date: date,
      dayName: weekDays[dowMonFirst],
      isToday: isSameDay(date, today(getLocalTimeZone())),
      isWeekend,
      events: getEventsForDate(date)
    })
  }
  return days
})

const getEventsForDate = (date: CalendarDate) => {
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  return visibleEvents.value.filter(event => {
    const startDate = event.start_date
    const endDate = event.end_date
    return dateStr >= startDate && dateStr <= endDate
  })
}

// Funciones para renderizar eventos multi-día con múltiples colores
const getEventBarClasses = (event: CalendarEvent, dateStr: string) => {
  const position = getEventPosition(event, dateStr)
  return {
    'rounded-l-md': position === 'start' || position === 'single',
    'rounded-r-md': position === 'end' || position === 'single',
    'rounded-md': position === 'single',
  }
}

const getEventBarStyle = (event: CalendarEvent, dateStr: string) => {
  const colors = getEventColors(event, { usePriority: !isJefeImportaciones.value })
  const position = getEventPosition(event, dateStr)
  
  let background: string
  
  if (colors.length === 1) {
    // Un solo color
    background = colors[0]
  } else if (colors.length === 2) {
    // Dos colores - gradiente diagonal
    background = `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
  } else {
    // Múltiples colores - dividir en diagonal
    const stops = colors.map((color, i) => {
      const start = (i / colors.length) * 100
      const end = ((i + 1) / colors.length) * 100
      return `${color} ${start}%, ${color} ${end}%`
    }).join(', ')
    background = `linear-gradient(135deg, ${stops})`
  }
  
  return {
    background,
    marginLeft: position === 'start' || position === 'single' ? '2px' : '0',
    marginRight: position === 'end' || position === 'single' ? '2px' : '0',
  }
}

const shouldShowEventTitle = (event: CalendarEvent, dateStr: string) => {
  const position = getEventPosition(event, dateStr)
  return position === 'start' || position === 'single'
}

const dayEvents = computed(() => {
  const d = currentDate.value as CalendarDate
  return getEventsForDate(d)
})

const formatDayHeader = (date: CalendarDate) => {
  if (!date) return ''
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  try {
    // Calcular el día de la semana usando una fecha JavaScript
    const jsDate = new Date(date.year, date.month - 1, date.day)
    const dayOfWeek = jsDate.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const dayName = days[dayOfWeek] || days[0] // Fallback a Domingo si hay error
    return `${dayName}, ${date.day} de ${months[date.month - 1]}`
  } catch (error) {
    // Fallback si hay error
    console.error('Error formatting day header:', error)
    return `${date.day} de ${months[date.month - 1]}`
  }
}

const formatDaySubheader = (date: CalendarDate) => {
  if (!date) return ''
  const todayDate = today(getLocalTimeZone()) as CalendarDate
  if (isSameDay(date as CalendarDate, todayDate)) {
    return 'Hoy'
  }
  return ''
}

const handleHourClick = (hour: string) => {
  const [hours, minutes] = hour.split(':')
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  
  quickCreateModal.open({
    selectedDate: currentDate.value as CalendarDate,
    onSelect: (type: 'evento' | 'tarea') => {
      eventModal.open({
        event: null,
        initialDate: dateStr,
        initialTime: hour,
        type: type,
        onSave: async (data: CreateEventRequest | UpdateEventRequest) => {
          await handleSaveEvent(data)
        }
      })
    }
  })
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

const getEventTopPosition = (event: CalendarEvent) => {
  if (!event.start_time) return '0px'
  const [hours, minutes] = event.start_time.split(':')
  const hour = parseInt(hours)
  const minute = parseInt(minutes)
  return `${(hour * 64) + (minute / 60 * 64)}px`
}

const getEventHeight = (event: CalendarEvent) => {
  if (!event.start_time || !event.end_time) return '64px'
  const [startHours, startMinutes] = event.start_time.split(':')
  const [endHours, endMinutes] = event.end_time.split(':')
  const start = parseInt(startHours) * 60 + parseInt(startMinutes)
  const end = parseInt(endHours) * 60 + parseInt(endMinutes)
  const duration = end - start
  return `${(duration / 60) * 64}px`
}

// Posición "Ver más" debajo de los primeros N eventos (vista semana)
const getVerMasTopPosition = (firstEvents: CalendarEvent[]) => {
  if (firstEvents.length === 0) return '0px'
  const last = firstEvents[firstEvents.length - 1]
  const topStr = getEventTopPosition(last)
  const heightStr = getEventHeight(last)
  const top = parseInt(topStr, 10) || 0
  const height = parseInt(heightStr, 10) || 64
  return `${top + height + 4}px`
}

const updateUrl = () => {
  const year = currentDate.value.year
  const month = currentDate.value.month
  const day = currentDate.value.day
  
  let url = '/calendar'
  const params = new URLSearchParams()
  
  if (viewMode.value === 'day') {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('day', day.toString())
    params.set('view', 'day')
  } else if (viewMode.value === 'week') {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('view', 'week')
  } else {
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('view', 'month')
  }
  
  url = `/calendar?${params.toString()}`
  router.replace(url)
}

const previousPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.subtract({ months: 1 })
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.subtract({ weeks: 1 })
  } else if (viewMode.value === 'day') {
    currentDate.value = currentDate.value.subtract({ days: 1 })
  }
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const nextPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add({ months: 1 })
  } else if (viewMode.value === 'week') {
    currentDate.value = currentDate.value.add({ weeks: 1 })
  } else if (viewMode.value === 'day') {
    currentDate.value = currentDate.value.add({ days: 1 })
  }
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const goToToday = () => {
  currentDate.value = today(getLocalTimeZone())
  updateUrl()
  pendingLoadEvents.value = true
  // La petición se hará después de la animación
}

const loadEventsWithRange = async () => {
  const start = filters.value?.start_date
  const end = filters.value?.end_date
  if (!start || !end) return
  await getEvents({
    start_date: start,
    end_date: end
  }, true)
}

const loadEvents = async (force = false) => {
  if (viewMode.value === 'range' && filters.value?.start_date && filters.value?.end_date) {
    await getEvents({
      start_date: filters.value.start_date,
      end_date: filters.value.end_date
    }, force)
    return
  }

  let startDate: string
  let endDate: string
  
  if (viewMode.value === 'day') {
    // Cargar solo el día actual
    const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
    startDate = dateStr
    endDate = dateStr
  } else if (viewMode.value === 'week') {
    const y = currentDate.value.year
    const m = currentDate.value.month
    const d = currentDate.value.day
    const currentDay = parseDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    const mondayOffset = getMondayBasedWeekday(y, m, d)
    const monday = currentDay.subtract({ days: mondayOffset })
    const sunday = monday.add({ days: 6 })
    startDate = `${monday.year}-${String(monday.month).padStart(2, '0')}-${String(monday.day).padStart(2, '0')}`
    endDate = `${sunday.year}-${String(sunday.month).padStart(2, '0')}-${String(sunday.day).padStart(2, '0')}`
  } else {
    // Modo mes: cargar todo el mes
    const year = currentDate.value.year
    const month = currentDate.value.month
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = parseDate(startDate).set({ day: parseDate(startDate).calendar.getDaysInMonth(parseDate(startDate)) })
    endDate = `${lastDay.year}-${String(lastDay.month).padStart(2, '0')}-${String(lastDay.day).padStart(2, '0')}`
  }
  
  await getEvents({
    start_date: startDate,
    end_date: endDate
  }, force)
}

const handleDayClick = (date: CalendarDate) => {
  if (isDateWeekend(date)) return
  if (!calendarPermissions.value.canEditActivity) {
    //redirect to page /calendar/progreso
    navigateTo('/calendar/progreso')
    return
  }
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  
  activityModalOpenKey.value++
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: null,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    initialDate: dateStr,
    onSave: async (data: CreateCalendarEventRequest) => {
      await handleSaveActivityOverlay(data)
    },
    onCreateActivity: async (name: string) => {
      return await createActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onUpdateActivity: async (id: number, name: string) => updateActivityInCatalog(id, name),
    onClose: () => {
      activityModal.close()
    }
  })
}

const openCreateActivity = () => {
  if (!isJefeImportaciones.value) {
    showError('Sin permisos', 'Solo el Jefe de Importaciones puede crear actividades.')
    return
  }
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: null,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    initialDate: dateStr,
    onSave: async (data: CreateCalendarEventRequest) => {
      await handleSaveActivityOverlay(data)
    },
    onCreateActivity: async (name: string) => {
      return await createActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onUpdateActivity: async (id: number, name: string) => updateActivityInCatalog(id, name),
    onClose: () => {
      activityModal.close()
    }
  })
}

const openCreateModal = () => {
  const dateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
  activityModalOpenKey.value++
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: null,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    initialDate: dateStr,
    onSave: async (data: CreateCalendarEventRequest) => {
      await handleSaveActivityOverlay(data)
    },
    onCreateActivity: async (name: string) => {
      return await createActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onUpdateActivity: async (id: number, name: string) => updateActivityInCatalog(id, name),
    onClose: () => {
      activityModal.close()
    }
  })
}

const openEditModal = (event: CalendarEvent) => {
  // Abrir el modal de editar actividad
  console.log(calendarPermissions.value.canEditActivity)
  if (!calendarPermissions.value.canEditActivity) {
    navigateTo('/calendar/progreso')
    return
  }
  activityModalOpenKey.value++
  activityModal.open({
    openKey: activityModalOpenKey.value,
    event: event,
    responsables: responsables.value,
    contenedores: contenedores.value,
    calendarPermissions: calendarPermissions.value,
    getResponsableColor: getResponsableColor,
    actividadesPredefinidas: activityCatalog.value,
    onSave: async (data: CreateCalendarEventRequest) => {
      const updateData = { ...data, id: event.id }
      await handleUpdateActivityOverlay(updateData)
    },
    onCreateActivity: async (name: string) => {
      return await createActivityInCatalog(name)
    },
    onDeleteFromCatalog: onDeleteFromCatalogOverlay,
    onUpdateActivity: async (id: number, name: string) => updateActivityInCatalog(id, name),
    onDelete: async () => {
      selectedEvent.value = event
      isDeleteModalOpen.value = true
      activityModal.close()
    },
    onClose: () => {
      activityModal.close()
    }
  })
}

const handleSaveEvent = async (data: CreateEventRequest | UpdateEventRequest) => {
  try {
    if ('id' in data) {
      // Actualizar
      const result = await updateEvent(data as UpdateEventRequest)
      if (result) {
        showSuccess('Evento actualizado', 'El evento se ha actualizado correctamente.')
        await loadEvents()
      } else {
        showError('Error', 'No se pudo actualizar el evento.')
      }
    } else {
      // Crear
      const result = await createEvent(data)
      if (result) {
        showSuccess('Evento creado', 'El evento se ha creado correctamente.')
        await loadEvents()
      } else {
        showError('Error', 'No se pudo crear el evento.')
      }
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al guardar el evento.')
  }
}

// Handler para guardar actividades usando el overlay modal
const handleSaveActivityOverlay = async (data: CreateCalendarEventRequest) => {
  try {
    const result = await createActivity(data)
    if (result) {
      showSuccess('Actividad creada', 'La actividad se ha creado correctamente.')
      activityModal.close()
      await loadEvents(true)
      if (viewMode.value === 'activities') {
        await loadActivitiesData(true)
      }
      await loadProgress(true)
    } else {
      showError('Error', 'No se pudo crear la actividad.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al guardar la actividad.')
  }
}

// Handler para actualizar actividades usando el overlay modal
const handleUpdateActivityOverlay = async (data: CreateCalendarEventRequest & { id: number }) => {
  try {
    const result = await updateActivity(data)
    if (result) {
      showSuccess('Actividad actualizada', 'La actividad se ha actualizado correctamente.')
      activityModal.close()
      await loadEvents(true)
      if (viewMode.value === 'activities') {
        await loadActivitiesData(true)
      }
      await loadProgress(true)
    } else {
      showError('Error', 'No se pudo actualizar la actividad.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al actualizar la actividad.')
  }
}

const confirmDelete = async () => {
  if (!selectedEvent.value?.id) return
  
  try {
    const taskDayId = selectedEvent.value.task_day_id
    const success = await deleteEvent(selectedEvent.value.id, taskDayId)
    if (success) {
      showSuccess('Evento eliminado', taskDayId ? 'El día de la tarea se ha eliminado correctamente.' : 'El evento se ha eliminado correctamente.')
      isDeleteModalOpen.value = false
      selectedEvent.value = null
      await loadEvents()
    } else {
      showError('Error', 'No se pudo eliminar el evento.')
    }
  } catch (err: any) {
    showError('Error', err?.message || 'Ocurrió un error al eliminar el evento.')
  }
}

// Cargar eventos al montar
onMounted(async () => {
  // Inicializar datos del store (responsables, contenedores, colores, catálogo)
  await initializeStore()
  // Refrescar catálogo de actividades (colores) para que getEventColors use el color de la actividad
  await loadActivityCatalog(true)
  // Si no es jefe, por defecto mostrar solo "mis" eventos (filtro responsable = yo)
  if (!isJefeImportaciones.value && (filters.value.responsable_id === undefined || filters.value.responsable_id === null)) {
    const uid = Number(currentUserId.value) || 0
    if (uid) setFilter('responsable_id', uid)
  }
  // Si no es jefe, por defecto filtrar por el 1er y último día del mes actual
  if (!isJefeImportaciones.value && (!filters.value.start_date || !filters.value.end_date)) {
    const y = currentDate.value.year
    const m = currentDate.value.month
    const firstDayStr = `${y}-${String(m).padStart(2, '0')}-01`
    const firstDay = parseDate(firstDayStr)
    const lastDay = firstDay.set({ day: firstDay.calendar.getDaysInMonth(firstDay) })
    const lastDayStr = `${lastDay.year}-${String(lastDay.month).padStart(2, '0')}-${String(lastDay.day).padStart(2, '0')}`
    setDateRange(firstDayStr, lastDayStr)
  }
  loadEvents()
  // Actualizar URL inicial si no hay parámetros
  if (!route.query.year && !route.query.month) {
    updateUrl()
  }
  
  // Si la vista inicial es actividades, cargar datos
  if (viewMode.value === 'activities') {
    await loadActivitiesData()
  }
})

// Función que se ejecuta cuando la transición completa
const onTransitionComplete = () => {
  if (pendingLoadEvents.value) {
    pendingLoadEvents.value = false
    loadEvents()
  }
}

// Recargar eventos cuando cambia la fecha o el modo de vista (solo si no hay transición pendiente)
watch([currentDate, viewMode], () => {
  // Si no hay una transición pendiente, cargar inmediatamente (para cambios que no activan animación)
  if (!pendingLoadEvents.value) {
    loadEvents()
  }
})

// Al volver del catálogo de actividades, refrescar catálogo y eventos para que se pinten los colores
watch(() => route.path, async (to, from) => {
  const fromCatalog = from && (from === '/calendar/actividades-catalogo' || from.endsWith('/actividades-catalogo'))
  if (to === '/calendar' && fromCatalog) {
    await loadActivityCatalog(true)
    if (viewMode.value === 'activities') {
      await loadActivitiesData(true)
    } else {
      await getEvents(undefined, true)
    }
  }
})

// Observar cambios en la ruta para sincronizar el estado
watch(() => route.query, (newQuery) => {
  const yearParam = newQuery.year ? parseInt(newQuery.year as string) : null
  const monthParam = newQuery.month ? parseInt(newQuery.month as string) : null
  const dayParam = newQuery.day ? parseInt(newQuery.day as string) : null
  const viewParam = newQuery.view as string

  if (yearParam && monthParam && !isNaN(yearParam) && !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12) {
    if (dayParam && !isNaN(dayParam) && dayParam >= 1 && dayParam <= 31) {
      // Vista de día
      try {
        const newDate = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-${String(dayParam).padStart(2, '0')}`) as CalendarDate
        const newDateStr = `${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`
        const currentDateStr = `${currentDate.value.year}-${String(currentDate.value.month).padStart(2, '0')}-${String(currentDate.value.day).padStart(2, '0')}`
        if (newDateStr !== currentDateStr) {
          currentDate.value = newDate
        }
        if (viewMode.value !== 'day') {
          viewMode.value = 'day'
        }
      } catch {
        // Ignorar errores de parsing
      }
    } else {
      // Vista de mes o semana
      try {
        const newDate = parseDate(`${yearParam}-${String(monthParam).padStart(2, '0')}-01`) as CalendarDate
        if (newDate.year !== currentDate.value.year || newDate.month !== currentDate.value.month) {
          currentDate.value = newDate
        }
        const newViewMode = (viewParam === 'week' ? 'week' : 'month') as 'month' | 'week' | 'day'
        if (viewMode.value !== newViewMode) {
          viewMode.value = newViewMode
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
  }
}, { immediate: false })

definePageMeta({
  middleware: ['auth']
})
</script>

<style scoped>
/* Animación de pase de página */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>

