<template>
  <AppToastRegion />
  <RouterView />
</template>

<script setup lang="ts">
import AppToastRegion from '@/components/AppToastRegion.vue';
import { RouterView } from 'vue-router';
</script>
