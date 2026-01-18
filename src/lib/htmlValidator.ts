import { JSDOM } from 'jsdom'

import {
  HtmlValidationError,
  HtmlValidationResult,
  ValidationErrorCode,
} from '@/types'

const DATE_FORMAT_REGEX = /^\w+,\s+\d{2}\.\d{2}\.\d{4}$/
const TIME_FORMAT_REGEX = /^\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2}$/
const MIN_COURSE_CELLS = 6

export function validateHtmlStructure(
  htmlContent: string,
  shop: number,
): HtmlValidationResult {
  const errors: HtmlValidationError[] = []
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document

  // 1. Validate table existence
  const table = document.querySelector('table')
  if (!table) {
    errors.push({
      code: ValidationErrorCode.TABLE_MISSING,
      message: 'Main course table not found',
      selector: 'table',
    })
    return buildResult(shop, errors, htmlContent)
  }

  // 2. Validate filter selects (should be 2)
  const filterSelects = document.querySelectorAll('select.course-list__filter')
  if (filterSelects.length !== 2) {
    errors.push({
      code: ValidationErrorCode.FILTER_SELECT_MISSING,
      message: 'Expected 2 filter selects, found different count',
      selector: 'select.course-list__filter',
      expected: '2',
      actual: String(filterSelects.length),
    })
  }

  // 3. Validate date header rows exist
  const dateHeaderRows = table.querySelectorAll(
    'tr.course-list__table__date-header',
  )
  if (dateHeaderRows.length === 0) {
    errors.push({
      code: ValidationErrorCode.DATE_HEADER_ROW_MISSING,
      message: 'No date header rows found',
      selector: 'tr.course-list__table__date-header',
    })
  }

  // 4. Validate date format in header rows
  dateHeaderRows.forEach((row, index) => {
    const cell = row.querySelector('td')
    const dateText = cell?.textContent?.trim() ?? ''
    if (dateText && !DATE_FORMAT_REGEX.test(dateText)) {
      errors.push({
        code: ValidationErrorCode.DATE_FORMAT_CHANGED,
        message: `Date format changed in row ${index + 1}`,
        selector: 'tr.course-list__table__date-header td',
        expected: 'Weekday, DD.MM.YYYY (e.g., Montag, 01.01.2024)',
        actual: dateText,
      })
    }
  })

  // 5. Validate course rows
  const courseRows = table.querySelectorAll('tr.course-list__table__course')
  if (courseRows.length === 0 && dateHeaderRows.length > 0) {
    errors.push({
      code: ValidationErrorCode.COURSE_ROW_STRUCTURE_INVALID,
      message: 'Date headers exist but no course rows found',
      selector: 'tr.course-list__table__course',
    })
  }

  // 6. Validate course row structure
  courseRows.forEach((row, index) => {
    const cells = row.querySelectorAll('td')

    // Check minimum cell count
    if (cells.length < MIN_COURSE_CELLS) {
      errors.push({
        code: ValidationErrorCode.CELL_COUNT_MISMATCH,
        message: `Course row ${index + 1} has fewer cells than expected`,
        selector: 'tr.course-list__table__course td',
        expected: `>= ${MIN_COURSE_CELLS}`,
        actual: String(cells.length),
      })
    }

    // Check time format in first cell
    const timeCell = cells[0]?.textContent?.trim() ?? ''
    if (timeCell && !TIME_FORMAT_REGEX.test(timeCell)) {
      errors.push({
        code: ValidationErrorCode.TIME_FORMAT_CHANGED,
        message: `Time format changed in course row ${index + 1}`,
        selector: 'tr.course-list__table__course td:first-child',
        expected: 'HH:MM - HH:MM or HH:MM – HH:MM',
        actual: timeCell,
      })
    }
  })

  return buildResult(shop, errors, htmlContent)
}

function buildResult(
  shop: number,
  errors: HtmlValidationError[],
  htmlContent: string,
): HtmlValidationResult {
  return {
    timestamp: new Date(),
    shop,
    isValid: errors.length === 0,
    errors,
    rawHtmlSample: errors.length > 0 ? htmlContent.slice(0, 500) : undefined,
  }
}
