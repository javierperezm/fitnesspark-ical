import { DateTime } from 'luxon'

import delay from '@/lib/delay'
import { sendStructureAlert } from '@/lib/emailAlerts'
import extractEventsByDay from '@/lib/extractEventsByDay'
import { redis } from '@/lib/redis'
import {
  FitnessparkEvent,
  FitnessparkFetchDataFilter,
  HtmlValidationResult,
} from '@/types'

const TIMEZONE = 'Europe/Zurich'

export class ScrapperWorker {
  protected MAX_DAYS: number = 7
  protected MIN_TTL: number = 60 * 60 // 1h
  protected MAX_TTL: number = 60 * 60 * 24 // 1d
  protected INTERVAL_SECONDS: number = 0.5

  protected events: FitnessparkEvent[] = []
  protected validationFailures: HtmlValidationResult[] = []

  protected dates: Date[] = []
  protected queue: (() => Promise<FitnessparkEvent[]>)[] = []
  protected isFiltersDataSaved: boolean = false

  constructor(protected shops: number[]) {
    // get 7 days of data using Europe/Zurich timezone
    const todayZurich = DateTime.now().setZone(TIMEZONE).startOf('day')
    const yesterday = todayZurich.minus({ days: 1 })
    for (let i = 0; i < 7; i++) {
      const date = yesterday.plus({ days: i }).toJSDate()
      this.dates.push(date)
    }
  }

  protected getKey = (shop: number, date: Date) =>
    `fitnesspark-shop-day-events-${shop}-${DateTime.fromJSDate(date, { zone: TIMEZONE }).toFormat('yyyy-MM-dd')}`

  protected getCache = async (shop: number, date: Date) =>
    await redis.get<FitnessparkEvent[]>(this.getKey(shop, date))

  protected setCache = async (
    shop: number,
    date: Date,
    events: FitnessparkEvent[],
  ) => {
    const eventsKey = this.getKey(shop, date)
    await redis.set<FitnessparkEvent[]>(eventsKey, events)
    await redis.expire(eventsKey, this.calculateTTL(date))
  }

  protected calculateTTL = (date: Date) => {
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const distributionHours = this.MAX_DAYS * 24

    let ttl
    if (diffInHours < 24) {
      ttl = this.MIN_TTL
    } else if (diffInHours >= 24 && diffInHours < distributionHours) {
      ttl = Math.round(
        this.MIN_TTL +
          (diffInHours - 24) *
            ((this.MAX_TTL - this.MIN_TTL) / (distributionHours - 24)),
      )
    } else {
      ttl = this.MAX_TTL
    }

    return ttl
  }

  async scrapData(shop: number, date: Date): Promise<FitnessparkEvent[]> {
    const timeStart = Date.now()
    const { events, locations, categories, validation } =
      await extractEventsByDay(shop, date)
    const timeElapsed = (Date.now() - timeStart) / 1000
    console.log('scrapData', { timeElapsed, shop, date, events: events.length })

    // Collect validation failures
    if (!validation.isValid) {
      console.warn('HTML validation failed', {
        shop,
        date,
        errors: validation.errors,
      })
      this.validationFailures.push(validation)
    }

    await this.setCache(shop, date, events)

    if (!this.isFiltersDataSaved) {
      this.isFiltersDataSaved = true
      await redis.set<FitnessparkFetchDataFilter[]>('locations', locations)
      await redis.set<FitnessparkFetchDataFilter[]>('categories', categories)
    }

    return events
  }

  async waitForQueue(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      while (this.queue.length > 0) {
        const fn = this.queue.shift()
        if (fn) {
          const events = await fn()
          this.events.push(...events)
        }

        if (this.queue.length > 0) await delay(this.INTERVAL_SECONDS)
      }
      resolve()
    })
  }

  async execute(): Promise<FitnessparkEvent[]> {
    console.log('execute', { shops: this.shops, dates: this.dates })
    for (const date of this.dates) {
      for (const shop of this.shops) {
        const events = await this.getCache(shop, date)
        if (events) {
          console.log('cached data found', {
            shop,
            date,
            events: events.length,
          })
          this.events.push(...events)
          continue
        }

        this.queue.push(() => this.scrapData(shop, date))
      }
    }

    console.log('scrapping queue starts', { length: this.queue.length })
    const timeStart = Date.now()
    await this.waitForQueue()
    const timeElapsed = (Date.now() - timeStart) / 1000
    console.log('scrapping queue ends', {
      timeElapsed,
      events: this.events.length,
    })

    // Send alerts for validation failures
    if (this.validationFailures.length > 0) {
      console.warn('Sending structure alert', {
        failures: this.validationFailures.length,
      })
      await sendStructureAlert(this.validationFailures)
    }

    return this.events
  }
}
