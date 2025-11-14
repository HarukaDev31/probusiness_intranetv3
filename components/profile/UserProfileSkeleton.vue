<template>
    <div class="p-8">
        <h1 class="text-xl font-medium text-onix-pro">Mi cuenta</h1>
    </div>
    <div class="user-profile-skeleton">
        <UCard class=" skeleton-header">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-name"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>

        </UCard>
        <UCard class=" skeleton-details">
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
            <div class="skeleton-detail"></div>
        </UCard>
        <UCard class=" profile-stats-skeleton">
            <div class="skeleton-detail"></div>
            <div class="skeleton-mount"></div>
            <div class="skeleton-detail"></div>
        </UCard>
        <UCard class=" profile-goals-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-detail"></div>
        </UCard>
    </div>
</template>
<script setup lang="ts">

</script>
<style scoped >

.divider {
    border: none;
    border-top: 1px solid #ccc;
    margin: 1.5rem 0;
    width: 100%;
}
.user-profile-skeleton {
    display: grid;
    grid-template-areas:
        "profile-header profile-stats profile-goals"
        "profile-header business-details profile-goals";
    grid-template-columns: 1fr 2fr 2fr; /* La primera columna es más estrecha */
    grid-template-rows: auto auto; /* Cada fila se ajusta automáticamente */
    gap: 1.5rem;
    padding: 2rem;
}

. {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}

.skeleton-header {
    align-items: center;
    text-align: center;
    height: auto; /* Ajusta la altura automáticamente */
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.profile-stats-skeleton,
.business-details-skeleton,
.profile-goals-skeleton {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.skeleton-title {
    border-radius: 4px;
}

.skeleton-avatar {
    width: 100px; /* Coincide con el tamaño del avatar real */
    height: 100px;
    border-radius: 50%;
    margin: 0 auto;
}
.skeleton-name {
    width: 150px;
    height: 20px;
    border-radius: 4px;
    margin: 0 auto;
}
.skeleton-mount {
    width: 100%;
    height: 50px;
    border-radius: 4px;
    margin: 0 auto;
}
.skeleton-detail {
    width: 100%;
    height: 20px;
    border-radius: 4px;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.skeleton-details, .business-details-skeleton, .profile-stats-skeleton, .profile-goals-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.business-details-skeleton .skeleton-title,
.profile-goals-skeleton .skeleton-title {
    width: 200px;
    height: 20px;
    border-radius: 4px;
}
.skeleton-header {
    grid-area: profile-header;
}

.profile-stats-skeleton {
    grid-area: profile-stats;
}

.business-details-skeleton {
    grid-area: business-details;
}

.profile-goals-skeleton {
    grid-area: profile-goals;
}
</style>