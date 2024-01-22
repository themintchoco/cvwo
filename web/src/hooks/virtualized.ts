import { useEffect, useRef } from 'react'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

interface UseVirtualizedOptions {
  estimateSize?: number
  pageSize?: number
}

export const useVirtualized = <TData extends { id: number }>(
  queryResult: UseInfiniteQueryResult<InfiniteData<TData[]>>,
  { estimateSize = 400, pageSize = 10 } : UseVirtualizedOptions = {},
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: queryData, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = queryResult

  const count = queryData?.pages.reduce((acc, page) => acc + page.length, 0) ?? 0
  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize: () => estimateSize,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
    getItemKey: (index) => queryData?.pages[Math.floor(index / pageSize)][index % pageSize]?.id ?? -1,
  })

  const items = virtualizer.getVirtualItems()

  useEffect(() => {
    const last = items.at(-1)
    if (!last) return

    if (last.index === count - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [count, fetchNextPage, hasNextPage, isFetchingNextPage, items])

  const props = {
    ref: containerRef,
    h: virtualizer.getTotalSize(),
    pos: 'relative',
  } as const

  const data = queryData && items.map((item) => ({
    data: queryData.pages[Math.floor(item.index / pageSize)][item.index % pageSize],
    props: {
      key: item.key,
      pos: 'absolute',
      top: item.start - virtualizer.options.scrollMargin,
      w: '100%',
      ref: virtualizer.measureElement,
      'data-index': item.index,
    } as const,
  }))

  return { props, data, isLoading, isError }
}
