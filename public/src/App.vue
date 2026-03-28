<template>
  <div id="app-background"></div>

  <router-view></router-view>

</template>

<script setup>
</script>

<style lang="css" scoped>
body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

#app-background {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   z-index: -1;
   background:
     radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.2) 35%),
     linear-gradient(135deg, #dbeafe 0%, #f8fafc 45%, #fde68a 100%);
}
</style>
