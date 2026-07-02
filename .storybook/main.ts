import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
    stories: [
        '../components/**/*.stories.@(js|ts)',
        '../components/**/*.stories.mdx',
    ],
    framework: {
        name: '@storybook-vue/nuxt',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
}

export default config
