<template>
  <div id="app-background"></div>

  <router-view></router-view>

</template>

<script setup>
</script>

<style lang="css" scoped>
#app-background {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   z-index: -1;
   background:
     radial-gradient(circle at top, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.55) 32%, rgba(248, 250, 252, 0.88) 62%),
     linear-gradient(180deg, #ffffff 0%, #f8fafc 48%, #f1f5f9 100%);
}
</style>
