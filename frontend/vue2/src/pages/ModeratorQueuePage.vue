<template>
  <div style="max-width: 1000px; margin: 0 auto; padding: 16px">
    <div class="text-h5 mb-4">Очередь модерации</div>
    <v-simple-table>
      <thead><tr><th>Товар</th><th>Цена</th><th>Продавец</th><th>Решение</th></tr></thead>
      <tbody>
        <tr v-for="p in queue" :key="p.id">
          <td>{{ p.title }}</td>
          <td>${{ Number(p.price).toFixed(2) }}</td>
          <td>{{ p.seller.shopName }}</td>
          <td>
            <v-btn small color="green" dark class="mr-2" @click="approve(p.id)">Одобрить</v-btn>
            <v-btn small color="red" dark @click="rejecting = p.id">Отклонить</v-btn>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-dialog v-model="dialog" max-width="420">
      <v-card>
        <v-card-title>Причина отклонения</v-card-title>
        <v-card-text>
          <v-textarea v-model="reason" outlined label="Что исправить продавцу" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialog = false">Отмена</v-btn>
          <v-btn color="red" dark @click="reject">Отклонить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { api } from "../api";

export default {
  name: "ModeratorQueuePage",
  data: () => ({ queue: [], dialog: false, reason: "" }),
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      const res = await api.moderation.moderationQueue(1, 50);
      this.queue = res.data.data;
    },
    async approve(id) {
      await api.moderation.approveProduct(id);
      await this.load();
    },
    async reject() {
      if (!this.dialog) return;
      await api.moderation.rejectProduct(this.rejecting, { reason: this.reason });
      this.dialog = false;
      this.reason = "";
      await this.load();
    },
  },
};
</script>
