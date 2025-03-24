'use client'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ClipboardCopy,
} from 'lucide-react'

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

import { GOOGLE_CALENDAR_ADD_BY_URL } from '@/config'
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

  const handleAddToGoogleCalendar = async () => {
    if (!calendarUrl) return
    await navigator.clipboard.writeText(calendarUrl)
    window.open(GOOGLE_CALENDAR_ADD_BY_URL, '_blank')
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
              <CopyCalendarUrl url={calendarUrl} />

              <p className="text-sm text-gray-500 text-center">
                Click the button below to copy the link and redirect to Google
                Calendar, and then paste the URL
              </p>

              <Button
                className="w-full"
                onClick={handleAddToGoogleCalendar}
                variant="default"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Copy URL and go to Google Calendar
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

function CopyCalendarUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleCopy}
      className="w-full break-all flex items-center gap-2 bg-gray-100 rounded-xl py-6 text-sm font-mono justify-between text-gray-500 hover:text-black transition"
      aria-label="Copy to clipboard"
    >
      <code className="truncate max-w-[650px] font-mono">{url}</code>
      {copied ? <Check size={18} /> : <ClipboardCopy size={18} />}
    </Button>
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
