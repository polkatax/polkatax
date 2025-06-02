<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-gutter-y-xl">

        <!-- HERO -->
        <div class="gradient-bg">
          <div class="flex items-center q-pa-sm">
            <img src="white.ico" style="height: 3rem; margin: 5px" />
            <div class="text-h5 text-bold text-white">PolkaTax</div>
          </div>
          <div class="q-pa-xl text-center text-white">
            <q-intersection transition="fade" once>
              <div class="text-h3 text-bold q-mb-md">Simplify Your Substrate Tax Reporting</div>
            </q-intersection>
            <p class="text-subtitle1 q-mb-xl">
              Automatically fetch tax-relevant transactions from all Substrate chains and export for your tax software.
            </p>
            <q-btn label="Launch App" color="white" text-color="primary" size="lg" to="/wallets" class="launchbutton"/>
          </div>
        </div>

        <!-- SUPPORTED CHAINS -->
        <div class="content-wrapper text-center q-my-lg">
          <div class="section-title">Supported Chains</div>
          <div class="row justify-center q-col-gutter-md q-mt-lg">
            <q-intersection
              v-for="name in chains"
              :key="name"
              transition="scale"
              once
              class="col-6 col-sm-4 col-md-2 text-center">
              <q-card flat bordered class="hover-card q-pa-sm q-mb-md bg-white" style="border-radius: 16px;">
                <q-img :src="`/public/img/chain-logos/${name.toLowerCase()}.png`" />
                <div class="text-caption text-weight-medium q-mt-sm">{{ name }}</div>
              </q-card>
            </q-intersection>
          </div>
          <div>...and many more</div>
        </div>

        <!-- FEATURES -->
        <div class="features-section content-wrapper">
          <div class="section-title text-center">Powerful Features for Tax Compliance</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="(feature, i) in features"
              :key="i"
              class="col-12 col-md-4">
              <q-card class="q-pa-md">
                <div class="card-icon" :style="feature.style">
                  <q-icon :name="feature.icon" size="32px" />
                </div>
                <div class="text-h6 q-mb-sm">{{ feature.title }}</div>
                <div class="text-body2">{{ feature.desc }}</div>
              </q-card>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <q-intersection transition="fade" once>
          <div class="content-wrapper text-center">
            <div class="q-pa-xl cta text-white">
              <div class="text-h6 q-mb-sm">Ready to Simplify Your Crypto Taxes?</div>
              <p class="q-mb-md">
                Use PolkaTax for accurate, compliant tax reporting.
              </p>
              <q-btn label="Get Started for Free" color="white" text-color="primary" size="lg" class="launchbutton" to="/wallets"/>
            </div>
          </div>
        </q-intersection>

        <!-- FOOTER -->
        <div class="bg-grey-9 text-white q-pa-xl">
          <div class="row q-col-gutter-lg content-wrapper">
            <div class="col-12 col-md-4">
              <div class="row items-center">
                <q-img src="white.ico" style="border-radius: 50%; max-width: 2rem; height: 2rem;" fit="scale-down" />
                <span class="q-ml-sm text-weight-bold">PolkaTax</span>
              </div>
              <p class="text-grey-4 q-mt-sm">The easiest way to handle your Substrate chain tax reporting.</p>
            </div>
            <div class="col-6 col-md-3" v-for="(group, g) in footerLinks" :key="g">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ group.title }}</div>
              <div v-for="link in group.links" :key="link" class="text-grey-4">
                <a :href="link.link" class="text-grey-4">{{ link.label }}</a>
              </div>
            </div>
          </div>
          <div class="text-center text-grey-5 q-mt-lg">
            2025 PolkaTax
          </div>
          <div class="text-center text-grey-5">
           Crypto currency quotes provided by <a href="https://coingecko.com" class="text-grey-4">coingecko.com</a>
           </div>
        </div>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
const chains = [
  'Polkadot', 'Kusama', 'Moonbeam', 'Acala', 'Astar', 'Bifrost',
  'Mythos', 'Hydration', 'Peaq', 'EnergyWebX', 'Kilt', 'Crust'
];

const features = [
  {
    icon: 'receipt',
    title: 'Transaction Tracking',
    desc: 'Automatically fetch staking rewards, payments, swaps across all connected chains.',
    style: 'background-color: #fde2e4; color: #ec4899;',
  },
  {
    icon: 'description',
    title: 'Export Reports',
    desc: 'Generate PDF/CSV for further processing or direct usage.',
    style: 'background-color: #dbeafe; color: #3b82f6;',
  },
  {
    icon: 'calculate',
    title: 'Integration with taxation software',
    desc: 'Integrates with tax software such as Koinly.',
    style: 'background-color: #ede9fe; color: #8b5cf6;',
  }
];

const footerLinks = [
  { title: 'Product', links: [{ label: 'About', link: '/about' }] },
  { title: 'Resources', links: [ { label: 'Documentation', link: '/documentaiton' }, { label: 'GitHub', link: 'https://github.com/polkatax/polkatax' }] }
];
</script>

<style scoped>
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

a:hover.launchbutton {
  color: rgba(230, 0, 122, 0.8)!important;
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
  margin: 3rem auto;
}
</style>
