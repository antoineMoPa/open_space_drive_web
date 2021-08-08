<template>
  <div class="canvas-container"></div>
</template>

<script>

import OSDApp from "../classes/OSDApp.ts";

export default {
  name: 'HelloWorld',
  data() {
    return {
      count: 0
    }
  },
  mounted() {
    let canvasContainer = document.querySelectorAll(".canvas-container")[0];
    console.log(canvasContainer);
    let app = new OSDApp();
    canvasContainer.appendChild(app.canvas);
  }
}
</script>
