export default defineAppConfig({
    ui: {
      tabs: {
        slots: {
          root: 'flex items-center gap-2',
          list: 'relative flex p-1 group',
          indicator: 'absolute transition-[translate,width] duration-200',
          trigger: [
            'group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted data-[state=inactive]:border-2 data-[state=inactive]:border-gray-300 dark:data-[state=inactive]:border-gray-700 hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75',
            'transition-colors'
          ],
          leadingIcon: 'shrink-0',
          leadingAvatar: 'shrink-0',
          leadingAvatarSize: '',
          label: 'truncate',
          trailingBadge: 'shrink-0',
          trailingBadgeSize: 'sm',
          content: 'focus:outline w-full ',
        },
        variants: {
          color: {
            primary: '',
            secondary: '',
            success: '',
            info: '',
            warning: '',
            error: '',
            neutral: ''
          },
          variant: {
            pill: {
              list: 'bg-transparent rounded-lg',
              trigger: 'grow',
              indicator: 'rounded-md shadow-xs'
            },
            link: {
              list: 'border-default',
              indicator: 'rounded-full',
              trigger: 'focus:outline-none'
            }
          },
          orientation: {
            horizontal: {
              root: 'flex-col h-20',
              list: 'w-full h-full gap-2 ',
              indicator: 'border border-secondary left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)',
              trigger: 'justify-center'
            },
            vertical: {
              list: 'flex-col',
              indicator: 'top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)'
            }
          },
          size: {
            xs: {
              trigger: 'px-2 py-1 text-xs gap-1',
              leadingIcon: 'size-4',
              leadingAvatarSize: '3xs'
            },
            sm: {
              trigger: 'px-2.5 py-1.5 text-xs gap-1.5',
              leadingIcon: 'size-4',
              leadingAvatarSize: '3xs'
            },
            md: {
              trigger: 'px-3 py-1.5 text-sm gap-1.5',
              leadingIcon: 'size-5',
              leadingAvatarSize: '2xs'
            },
            lg: {
              trigger: 'px-3 py-2 text-sm gap-2',
              leadingIcon: 'size-5',
              leadingAvatarSize: '2xs'
            },
            xl: {
              trigger: 'px-3 py-2 text-base gap-2',
              leadingIcon: 'size-6',
              leadingAvatarSize: 'xs'
            }
          }
        },
        compoundVariants: [
          {
            orientation: 'horizontal',
            variant: 'pill',
            class: {
              indicator: 'inset-y-1'
            }
          },
          {
            orientation: 'horizontal',
            variant: 'link',
            class: {
              list: 'border-b -mb-px',
              indicator: '-bottom-px h-px'
            }
          },
          {
            orientation: 'vertical',
            variant: 'pill',
            class: {
              indicator: 'inset-x-1',
              list: 'items-center'
            }
          },
          {
            orientation: 'vertical',
            variant: 'link',
            class: {
              list: 'border-s -ms-px',
              indicator: '-start-px w-px'
            }
          },
          {
            color: 'primary',
            variant: 'pill',
            class: {
              indicator: 'bg-primary',
            }
          },
          {
            color: 'neutral',
            variant: 'pill',
            class: {
              indicator: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-300 py-0',
              trigger: 'data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-300 focus-visible:outline-2 hover:dark:text-gray-300 focus-visible:outline-offset-2 focus-visible:outline-inverted py-0'
            }
          },
          {
            color: 'transparent',
            variant: 'pill',
            class: {
              indicator: 'bg-transparent',
              trigger: 'data-[state=active]:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlighted'
            }
          },
          {
            color: 'primary',
            variant: 'link',
            class: {
              indicator: 'bg-primary',
              trigger: 'data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
            }
          },
          {
            color: 'neutral',
            variant: 'link',
            class: {
              indicator: 'bg-inverted',
              trigger: 'data-[state=active]:text-highlighted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted'
            }
          }
        ],
        defaultVariants: {
          color: 'primary',
          variant: 'pill',
          size: 'md'
        }
      }
    }
  })
  