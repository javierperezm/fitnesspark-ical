'use client'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { set } from 'date-fns'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { useFilters } from '@/hooks/use-filters'
import generateCalendarUrl from '@/lib/generateCalendarUrl'
import { cn } from '@/lib/utils'
import { FitnessparkFetchDataFilter } from '@/types'

// Mock data - in a real app, this would come from an API
export function CalendarForm() {
  const [openCenters, setOpenCenters] = useState(false)
  const [openCategories, setOpenCategories] = useState(false)
  const [selectedCenters, setSelectedCenters] = useState<number[]>([])
  const [selectedClassTypes, setSelectedClassTypes] = useState<number[]>([])

  const { data, isError, isLoading } = useFilters()

  const handleCenterSelect = (centerId: number) => {
    setSelectedCenters((current) => {
      if (current.includes(centerId)) {
        return current.filter((id) => id !== centerId)
      } else {
        return [...current, centerId]
      }
    })
  }

  const handleClassTypeSelect = (classTypeId: number) => {
    setSelectedClassTypes((current) => {
      if (current.includes(classTypeId)) {
        return current.filter((id) => id !== classTypeId)
      } else {
        return [...current, classTypeId]
      }
    })
  }

  const calendarUrl = useMemo(() => {
    if (selectedCenters.length === 0) return null

    const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port && window.location.port !== '80' ? `:${window.location.port}` : ''}`

    return generateCalendarUrl(selectedCenters, selectedClassTypes, baseUrl)
  }, [selectedCenters, selectedClassTypes])

  const handleAddToGoogleCalendar = () => {
    if (!calendarUrl) return

    // Google Calendar import URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(calendarUrl)}`
    window.open(googleCalendarUrl, '_blank')
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6  flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold mb-3">Select Centers</h3>
            <Popover open={openCenters} onOpenChange={setOpenCenters}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCenters}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {selectedCenters.length > 0
                    ? `${selectedCenters.length} center${selectedCenters.length > 1 ? 's' : ''} selected`
                    : 'Select centers...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search centers..." />
                  <CommandList>
                    <CommandEmpty>No center found.</CommandEmpty>
                    <CommandGroup>
                      {data?.locations.map((center) => (
                        <CommandItem
                          key={center.id}
                          value={center.name}
                          onSelect={() => handleCenterSelect(center.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCenters.includes(center.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {center.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <SelectedFiltersList
              selected={selectedCenters}
              items={data?.locations ?? []}
              setSelected={setSelectedCenters}
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3">Filter by Class Type</h3>

            <Popover open={openCategories} onOpenChange={setOpenCategories}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategories}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  {selectedClassTypes.length > 0
                    ? `${selectedClassTypes.length} center${selectedClassTypes.length > 1 ? 's' : ''} selected`
                    : 'Select centers...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search class type..." />
                  <CommandList>
                    <CommandEmpty>No class type found.</CommandEmpty>
                    <CommandGroup>
                      {data?.categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => handleClassTypeSelect(category.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedClassTypes.includes(category.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <SelectedFiltersList
              selected={selectedClassTypes}
              setSelected={setSelectedClassTypes}
              items={data?.categories ?? []}
            />
          </div>

          {calendarUrl ? (
            <div className="mt-6 space-y-4">
              <div className="p-3 bg-muted rounded-md break-all">
                <p className="text-sm font-mono">{calendarUrl}</p>
              </div>
              <Button
                className="w-full"
                onClick={handleAddToGoogleCalendar}
                variant="default"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Add to Google Calendar
              </Button>
            </div>
          ) : (
            <span>Please select at least one center</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const SelectedCategoriesList = ({
  categories,
  selected,
  setSelectedCategories,
}: {
  categories: FitnessparkFetchDataFilter[]
  selected: number[]
  setSelectedCategories: Dispatch<SetStateAction<number[]>>
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {selected?.map((catId) => {
        const type = categories.find((cat) => cat.id === catId) ?? {
          id: 0,
          name: '',
        }
        return (
          <div key={type.id} className="flex items-center space-x-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {type.name}
            </label>
          </div>
        )
      })}
    </div>
  )
}

const SelectedFiltersList = ({
  items,
  selected,
  setSelected,
}: {
  items: FitnessparkFetchDataFilter[]
  selected: number[]
  setSelected: Dispatch<SetStateAction<number[]>>
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {selected?.map((id) => {
        const item = items.find((i) => i.id === id) ?? {
          id: 0,
          name: '',
        }
        return (
          <Button
            key={item.id}
            variant="link"
            className="justify-normal text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 hover:text-red-600"
            onClick={() =>
              setSelected((current) => current.filter((id) => id !== item.id))
            }
          >
            {item.name}
          </Button>
        )
      })}
    </div>
  )
}
