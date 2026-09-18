import type { TableColumn } from '@nuxt/ui'

function mergeClass(current: unknown, extra: string): string {
  return [typeof current === 'string' ? current : '', extra].filter(Boolean).join(' ')
}

export function wrapChinaColumnGroup<T>(group: TableColumn<T>): TableColumn<T> {
  const children = (group.columns || []) as TableColumn<T>[]
  const last = children.length - 1
  const groupMeta = (group.meta || {}) as { class?: { th?: string, td?: string } }

  return {
    ...group,
    meta: {
      ...groupMeta,
      class: {
        ...(groupMeta.class || {}),
        th: mergeClass(groupMeta.class?.th, 'china-group-head'),
      },
    },
    columns: children.map((col, index) => {
      const colMeta = (col.meta || {}) as { class?: { th?: string, td?: string } }
      const edge = [
        'china-group-col',
        index === 0 ? 'china-group-start' : '',
        index === last ? 'china-group-end' : '',
      ].filter(Boolean).join(' ')

      return {
        ...col,
        meta: {
          ...colMeta,
          class: {
            ...(colMeta.class || {}),
            th: mergeClass(colMeta.class?.th, `china-group-th ${edge}`),
            td: mergeClass(colMeta.class?.td, `china-group-td ${edge}`),
          },
        },
      }
    }),
  }
}
