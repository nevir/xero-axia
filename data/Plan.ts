import { newLogger } from '../lib/log'
import {
  GoogleSheetsAPI,
  GoogleSpreadsheet,
  Spreadsheet,
} from './google/sheets'

const moduleLog = newLogger('[Plan]')

enum PlanSheets {
  OVERVIEW = 'Overview',
  ASSUMPTIONS = 'Assumptions',
}

const TEMPLATE: Spreadsheet = {
  properties: {
    title: 'Financial Plan',
  },
  sheets: Object.values(PlanSheets).map((title) => ({
    properties: {
      title,
      gridProperties: {
        rowCount: 1,
        columnCount: 1,
      },
    },
  })),
}

const recentPlanKeys = new Map<string, object>()
const recentPlans = new WeakMap<object, Plan>()

export class Plan {
  static async create(api: GoogleSheetsAPI) {
    moduleLog.debug('{create}')

    const spreadsheet = await api.create(TEMPLATE)
    return new this(spreadsheet)
  }

  static async get(api: GoogleSheetsAPI, id: string) {
    const log = moduleLog.child('{get}')
    log.debug(id)

    const key = recentPlanKeys.get(id)
    if (key) {
      const plan = recentPlans.get(key)
      if (plan) {
        log.debug('loading memoized Plan', plan)
        return plan
      }
    }

    const spreadsheet = await api.get(id)
    log.debug('loaded spreadsheet:', spreadsheet)

    return new this(spreadsheet)
  }

  constructor(private _sheet: GoogleSpreadsheet) {
    const key = {}
    recentPlanKeys.set(this._sheet.id, key)
    recentPlans.set(key, this)
  }

  id = this._sheet.id
}
