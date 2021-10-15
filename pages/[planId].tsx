import * as react from 'react'
import { useRouter } from 'next/router'

import { Plan } from '../data/Plan'
import { useGoogleSheetsAPI } from '../data/google/react'

const FinancialPlan = () => {
  const { planId } = useRouter().query
  const sheetsApi = useGoogleSheetsAPI()
  const [plan, setPlan] = react.useState<Plan>()

  react.useEffect(() => {
    if (!sheetsApi) return
    if (typeof planId !== 'string') {
      throw new Error('Expected planId to be a string')
    }

    setPlan(undefined)
    Plan.get(sheetsApi, planId).then(setPlan)
  }, [sheetsApi, planId])

  return <h1>Hi {plan?.id || '...loading...'}</h1>
}

export default FinancialPlan
