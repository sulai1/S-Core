<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section class="row q-col-gutter-md items-center">
            <div class="col-12 col-sm-4">
              <q-img
                v-if="salesmanImage"
                :src="salesmanImage"
                alt="Salesman Image"
                class="detail-image"
              />
              <div v-else class="detail-image-placeholder flex flex-center text-grey-7">
                Kein Bild
              </div>
            </div>
            <div class="col-12 col-sm-8">
              <div class="text-h5">{{ salesman?.first }} {{ salesman?.last }}</div>
              <div class="text-subtitle2 text-grey-7">Verkäufer #{{ salesman?.id }}</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="stat-card">
                  <q-card-section>
                    <div class="text-caption text-grey-7">Insgesamt verkauft</div>
                    <div class="text-h6">{{ totalSold }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="stat-card">
                  <q-card-section>
                    <div class="text-caption text-grey-7">Gesamtbetrag</div>
                    <div class="text-h6">{{ formatCurrency(totalAmount) }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-sm-4">
                <q-card flat bordered class="stat-card">
                  <q-card-section>
                    <div class="text-caption text-grey-7">Durchschnittlicher Betrag</div>
                    <div class="text-h6">{{ formatCurrency((totalAmount / totalSold) || 0) }}</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>


          <q-card-actions align="right">
            <q-btn flat label="Zurück" @click="router.push({ name: 'salesmen' })" />
            <q-btn color="primary" label="Bearbeiten" @click="goToEdit" />
          </q-card-actions>
        </q-card>
      </div>
      <div class="col-12 col-lg-6 q-mt-md">
          <q-list dense padding>
            <q-item>
              <q-item-section>
                <q-item-label caption>Id</q-item-label>
                <q-item-label>{{ salesman?.id }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Vorname</q-item-label>
                <q-item-label>{{ salesman?.first || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Nachname</q-item-label>
                <q-item-label>{{ salesman?.last || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Telefon</q-item-label>
                <q-item-label>{{ salesman?.phone || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Bilddatei</q-item-label>
                <q-item-label>{{ salesman?.image || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Nachricht</q-item-label>
                <q-item-label>{{ salesman?.message || '—' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Erstellt am</q-item-label>
                <q-item-label>{{ formatDate(salesman?.createdAt) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Zuletzt geändert</q-item-label>
                <q-item-label>{{ formatDate(salesman?.updatedAt) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
      </div>
      <div class="col-12 col-lg-6 q-mt-md">
        <div class="text-h6">Umsatz-Historie</div>
        <TimelineChart
          v-if="transactionHistory.length > 0"
          :data="transactionHistory"
          title="Umsatz über Zeit"
          yAxisLabel="Umsatz (€)"
          backgroundColor="rgba(75, 192, 192, 0.1)"
          borderColor="rgb(75, 192, 192)"
          :fillArea="true"
        />
        <div v-else class="text-grey-7">
          Keine Transaktionen gefunden.
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="column q-gutter-md full-height">
                  <q-card>
            <q-card-section>
              <div class="text-h6">Ausweis-Historie</div>
              <div class="text-caption text-grey-7">Nach Datum absteigend sortiert</div>
            </q-card-section>

            <q-separator />

            <div :class="{ 'history-scroll': identifications.length > 5 }">
              <q-list v-if="identifications.length > 0" separator>
                <q-item v-for="entry in identifications" :key="entry.id">
                  <q-item-section>
                    <q-item-label>Ausweis #{{ entry.id_nr }}</q-item-label>
                    <q-item-label caption>Aktualisiert: {{ formatDate(entry.updatedAt) }}</q-item-label>
                    <q-item-label caption>Erstellt: {{ formatDate(entry.createdAt) }}</q-item-label>
                    <q-item-label caption>Gültig bis: {{ formatDate(entry.validTo) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side class="items-end q-gutter-sm">
                    <q-chip :color="isActive(entry.validTo) ? 'positive' : 'grey-6'" text-color="white">
                      {{ isActive(entry.validTo) ? 'Aktiv' : 'Abgelaufen' }}
                    </q-chip>
                    <q-btn flat round dense color="negative" icon="delete" @click="deleteIdentification(entry)" />
                  </q-item-section>
                </q-item>
              </q-list>

              <q-card-section v-else class="text-grey-7">
                Keine Ausweis-Historie gefunden.
              </q-card-section>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { Identification, Salesman } from '@s-core/talktogether';
import { useQuasar } from 'quasar';
import { baseUrl, datasource } from 'src/boot/di';
import type { TimelineSeries } from 'src/components/chart/TimelineChart.vue';
import TimelineChart from 'src/components/chart/TimelineChart.vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const salesman = ref<Salesman | null>(null);
const salesmanImage = ref<string | null>(null);
const identifications = ref<Identification[]>([]);
const transactionHistory = ref<TimelineSeries[]>([]);
const totalSold = ref(0);
const totalAmount = ref(0);

onMounted(async () => {
  const rawId = route.params.id;
  const salesmanId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  if (!Number.isInteger(salesmanId) || salesmanId <= 0) {
    alert('Valid salesman id is required');
    router.push({ name: 'salesmen' }).catch((e: unknown) => console.error(e));
    return;
  }

  const salesmanRes = await datasource.find('Salesman', {
    where: [{ function: '=', params: ['id', { value: salesmanId }] }],
    limit: 1,
  });

  if (!salesmanRes || salesmanRes.length === 0) {
    alert('Salesman not found');
    router.push({ name: 'salesmen' }).catch((e: unknown) => console.error(e));
    return;
  }

  salesman.value = salesmanRes[0] as Salesman;
  salesmanImage.value = salesman.value.image ? `${baseUrl}/images/${salesman.value.image}` : null;

  const idRes = await datasource.find('Identification', {
    where: [{ function: '=', params: ['salesman', { value: salesmanId }] }],
    orderBy: [['updatedAt', 'desc'], ['createdAt', 'desc'], ['id_nr', 'desc']],
  });

  identifications.value = idRes as Identification[];

  const transactionStatsRes = await datasource.find('Transaction', {
    attributes: {
      soldCount: { function: 'sum', params: ['quantity'] },
      soldAmount: { function: 'sum', params: ['total'] },
    },
    where: [
      { function: '=', params: ['salesman', { value: salesmanId }] },
      { function: '<', params: ['quantity', { value: 0 }] },
    ],
  });

  const transactionStats = transactionStatsRes[0] as { soldCount?: number; soldAmount?: number } | undefined;
  totalSold.value = Math.abs(Number(transactionStats?.soldCount ?? 0));
  totalAmount.value = Math.abs(Number(transactionStats?.soldAmount ?? 0));

  const transactionRes = await datasource.find('Transaction', {
    attributes: {
      date: { function: 'date_trunc', params: [{ value: 'day' }, 'date'] },
      value: { function: 'sum', params: ['total'] },
    },
    where: [{ function: '=', params: ['salesman', { value: salesmanId }] }],
    groupBy: [{ function: 'date_trunc', params: [{ value: 'day' }, 'date'] }],
    orderBy: [[{ function: 'date_trunc', params: [{ value: 'day' }, 'date'] }, 'asc']],
  });

  transactionHistory.value = [{
    label: 'Umsatz',
    events: (transactionRes as Array<{ date: string; value: number }>).map((entry) => ({
      date: entry.date,
      value: Number(entry.value ?? 0),
      label: 'Umsatz',
    })),
  }];
});

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function isActive(validTo?: string | null): boolean {
  if (!validTo) {
    return false;
  }

  return new Date(validTo).getTime() >= Date.now();
}

function goToEdit() {
  if (!salesman.value?.id) {
    return;
  }

  router.push({ name: 'edit-salesman', params: { id: salesman.value.id } }).catch((e: unknown) => console.error(e));
}

function deleteIdentification(entry: Identification) {
  if (!entry.id) {
    return;
  }

  $q.dialog({
    title: 'Ausweis löschen',
    message: `Ausweis #${entry.id_nr} wirklich löschen?`,
    ok: 'OK',
    cancel: 'Abbrechen',
    persistent: true,
  }).onOk(() => {
    void confirmDeleteIdentification(entry);
  });
}

async function confirmDeleteIdentification(entry: Identification) {
  if (!entry.id) {
    return;
  }

  await datasource.delete('Identification', [{ function: '=', params: ['id', { value: entry.id }] }]);
  identifications.value = identifications.value.filter((item) => item.id !== entry.id);
}
</script>

<style scoped>
.detail-image,
.detail-image-placeholder {
  width: 100%;
  min-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
}

.history-scroll {
  max-height: 420px;
  overflow-y: auto;
}

.full-height {
  height: 100%;
}

.stat-card {
  height: 100%;
}
</style>
