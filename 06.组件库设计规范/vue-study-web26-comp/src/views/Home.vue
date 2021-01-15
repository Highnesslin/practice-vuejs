<template>
  <div class="home">
    <Example msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import Example from "@/components/Example";

export default {
  name: "Home",
  components: {
    Example,
  },
};
</script>
