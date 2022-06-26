<script setup lang="ts">
const { onair } = useClient();

const bangumi = useBangumi();

const subjects = onair.map((onair) =>
  computedAsync(() => bangumi.subject(onair.bgmId))
);
</script>

<route>
{
  meta: {
    title: "所有番剧"
  }
}
</route>

<template>
  <div text-2xl mb4 font-bold>
    <h2><span i-carbon-earth-southeast-asia-filled></span> 正在播出</h2>
  </div>
  <div>
    <div
      v-for="(anime, idx) in onair"
      :key="anime.bgmId"
      border="1 base"
      rounded-2
      p8
      mb4
      flex="~ gap4"
      lt-md:flex-col
      justify-between
    >
      <div v-if="subjects[idx].value">
        <router-link :to="`/anime/` + anime.bgmId">
          <img
            :src="subjects[idx].value.images.large"
            alt=""
            w="240px"
            rounded-2
          />
        </router-link>
      </div>
      <div>
        <h3 mb4 font-bold text-xl>
          <router-link :to="'/anime/' + anime.bgmId">{{
            anime.title
          }}</router-link>
        </h3>
        <ChooseEpisodes :anime="anime"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
