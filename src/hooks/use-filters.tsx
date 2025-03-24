import { useQuery } from '@tanstack/react-query'

import { FitnessparkFetchDataFilter } from '@/types'

export const useFilters = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const res = await fetch('/api/filters')
      const data = await res.json()

      return data as {
        locations: FitnessparkFetchDataFilter[]
        categories: FitnessparkFetchDataFilter[]
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  return { data, isError, isLoading }
}
