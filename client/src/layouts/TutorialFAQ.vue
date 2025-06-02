<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-gutter-y-xl">

          <!-- Hero -->
          <div class="flex items-center q-pa-sm gradient-bg">
            <img src="white.ico" style="height: 3rem; margin: 5px" />
            <div class="text-h5 text-bold text-white">PolkaTax</div>
          </div>
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-bold">
          Need Help with PolkaTax?
        </div>
        <div class="text-subtitle1 q-mt-sm" style="color: #666;">
          Watch the quick tutorial or browse common questions below.
        </div>
      </div>

      <!-- Tutorial Video -->
      <div style="max-width: 900px" class="q-mx-auto">
        <q-card flat bordered class="q-pa-md" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <div class="text-h6 q-mb-md">
            Getting Started Tutorial
          </div>
          <div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              frameborder="0"
              allowfullscreen
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 12px;"
              title="PolkaTax Tutorial"
            ></iframe>
          </div>
        </q-card>
      </div>

      <!-- FAQ Section -->
      <div  style="max-width: 900px" class="q-mx-auto">
        <div class="text-h5 text-bold q-mb-md">Frequently Asked Questions</div>

        <q-expansion-item
        v-for="(item, index) in faqItems"
        :key="index"
        :label="item.question"
        group="faq"
        expand-icon="expand_more"
        dense="false"
        class="faq-item q-mb-md"
        style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.07);"
      >
        <div class="faq-answer q-pa-md">{{ item.answer }}</div>
      </q-expansion-item>
      </div>
        <!-- FOOTER -->
        <div class="bg-grey-9 text-white q-pa-xl">
          <div class="row q-col-gutter-lg content-wrapper">
            <div class="col-12 col-md-3">
              <div class="row items-center">
                <q-img src="white.ico" style="border-radius: 50%; max-width: 2rem; height: 2rem;" fit="scale-down" />
                <span class="q-ml-sm text-weight-bold">PolkaTax</span>
              </div>
              <p class="text-grey-4 q-mt-sm">The easiest way to handle your Substrate chain tax reporting.</p>
            </div>
            <div class="col-6 col-md-3" v-for="(group, g) in footerLinks" :key="g">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ group.title }}</div>
              <div v-for="link in group.links" :key="link" class="text-grey-4">
                <a href="#" class="text-grey-4">{{ link }}</a>
              </div>
            </div>
          </div>
          <div class="text-center text-grey-5 q-mt-lg">
            2025 PolkaTax
          </div>
        </div>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
const faqItems = [
  {
    question: 'How do I connect my Substrate wallet?',
    answer: 'To connect your wallet, click the "Launch App" button and follow the prompts to authorize access securely.'
  },
  {
    question: 'Which chains are supported?',
    answer: 'We currently support Polkadot, Kusama, Moonbeam, Acala, Astar, and many more Substrate-based chains.'
  },
  {
    question: 'How do I export my tax reports?',
    answer: 'Navigate to the Export section in the app and choose PDF or CSV format compatible with popular tax software like Koinly or TurboTax.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, PolkaTax only fetches transaction data with your permission and does not store sensitive information beyond what is necessary for tax calculation.'
  },
  {
    question: 'Can I use PolkaTax for multiple accounts?',
    answer: 'Yes, you can connect multiple wallets and manage their tax data in one unified dashboard.'
  }
]

const footerLinks = [
  { title: 'Product', links: ['Pricing', 'FAQ'] },
  { title: 'Resources', links: ['Documentation'] },
  { title: 'Company', links: ['About', 'Terms'] }
];
</script>

<style scoped>
.faq-item .q-expansion-item__header {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--q-primary);
  padding: 1.2rem 1.5rem;
  min-height: 60px;
}

.faq-item .q-expansion-item__content {
  background-color: #fafafa;
  border-radius: 0 0 16px 16px;
  padding: 1.5rem 2rem;
  color: #444;
  font-size: 1rem;
  line-height: 1.6;
  letter-spacing: 0.02em;
}

.q-page {
  background: white;
}

/* Keep video rounding smooth */
.video-wrapper iframe {
  border-radius: 12px;
}

.q-layout {
  font-family: 'Inter', sans-serif;
  margin: auto;
}

.section-title {
  font-weight: 700;
  font-size: 2rem;
  margin-bottom: 2rem;
}

.gradient-bg {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.q-btn {
  transition: transform 0.2s ease;
}
.q-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.q-card {
  transition: all 0.3s ease;
  border-radius: 20px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
.q-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.15);
}
.q-card:hover .card-icon {
  transform: scale(1.1) rotate(2deg);
  transition: transform 0.3s ease;
}

.hover-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.cta {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

a {
  transition: color 0.3s;
}
a:hover {
  color: white !important;
}

.features-section {
  background: #f9fafb;
  padding: 3rem 1rem;
  border-radius: 24px;
}

.content-wrapper {
  max-width: 1024px;
  margin: auto;
}
</style>
