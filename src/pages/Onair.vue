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
    title: "正在播出"
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
      mb16
      flex="~ md:gap8 initial"
      lt-md:flex-col
      rounded-2
    >
      <div v-if="subjects[idx].value" inline-block>
        <router-link
          :to="`/anime/` + anime.bgmId"
          inline-block
          w="md:200px lt-md:full"
          max-w="md:200px"
        >
          <picture w="full" max-w="full">
            <source
              :srcset="subjects[idx].value.images.medium"
              media="(max-width: 767.9px)"
            />
            <img
              :src="subjects[idx].value.images.large"
              :alt="subjects[idx].value.name_cn"
              w="full"
              max-w="full"
              object-contain
              rounded-2
            />
          </picture>
        </router-link>
      </div>
      <div inline-block>
        <h3 mb4 lt-md:mt2 font-bold text-xl>
          <router-link :to="'/anime/' + anime.bgmId">{{
            anime.title
          }}</router-link>
        </h3>
        <ChooseEpisodes :anime="anime"></ChooseEpisodes>
      </div>
    </div>
  </div>
</template>
