import { newLogger } from '../../lib/log'

import { GoogleAPI } from './api'

const moduleLog = newLogger('[google.sheets]       ')

export type Spreadsheet = gapi.client.sheets.Spreadsheet
export type Sheet = gapi.client.sheets.Sheet

export class GoogleSheetsAPI {
  static async load(api: GoogleAPI) {
    return new this(api.client.sheets.spreadsheets)
  }

  constructor(private _api: gapi.client.sheets.SpreadsheetsResource) {}

  async create(spreadsheet: Spreadsheet) {
    const log = moduleLog.child('{create}')
    log.debug(spreadsheet)

    const response = await this._api.create({
      resource: spreadsheet,
    })
    log.debug('response:', response)

    return new GoogleSpreadsheet(this._api, response.result)
  }

  async get(id: string) {
    const log = moduleLog.child('{get}')
    log.debug(id)

    const response = await this._api.get({
      spreadsheetId: id,
    })
    log.debug('response:', response)

    return new GoogleSpreadsheet(this._api, response.result)
  }
}

export class GoogleSpreadsheet {
  constructor(
    private _api: gapi.client.sheets.SpreadsheetsResource,
    public raw: Spreadsheet,
  ) {}

  id = this.raw.spreadsheetId!
}
