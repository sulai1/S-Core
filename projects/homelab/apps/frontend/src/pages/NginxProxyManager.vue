<template>
  <q-page class="q-pa-md">
    <h2>Nginx Proxy Manager</h2>
    <a href="https://proxy.sascha-wernegger.me">{{ version }}</a>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h4>Proxy Hosts</h4>
      <ProxyList :hosts="proxy_hosts" />
      <h4>Certificates</h4>
      <CertificateList :certificates="certificates"  />
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { type OpenApiResult } from '@s-tek/api';
import { onMounted, ref } from 'vue';
import useNpmApi, { type paths } from "../../src/composables/useNpmApi";
import ProxyList from '../components/NginxProxyManager/ProxyList.vue';
import CertificateList from '../components/NginxProxyManager/CertificateList.vue';

const npmApi = useNpmApi();
const proxy_hosts = ref<OpenApiResult<paths,"/nginx/proxy-hosts", "get">>([]);
const error = ref<string | null>(null);
const version = ref<string>('');
const certificates = ref<OpenApiResult<paths,"/nginx/certificates", "get">>([]);
const access_list = ref<OpenApiResult<paths,"/nginx/access-lists", "get">>();

onMounted(async () => {
  try {
    const versionReq =  await npmApi.getVersionCheck({});
    version.value = `NPM Version: ${versionReq.data.current} (Latest: ${versionReq.data.latest})`;
    const res = await npmApi.getProxyHosts({});
    proxy_hosts.value = res.data.sort((a, b) => a.id - b.id);
    certificates.value = (await npmApi.getCertificates({expand:"owner"})).data;
    access_list.value = (await npmApi.getAccessList({})).data;
  } catch (e) {
    error.value = (e as Error).message;
    console.error(error);
  }
});

</script>
<style scoped lang="scss">
  .host_domain_names {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

</style>
