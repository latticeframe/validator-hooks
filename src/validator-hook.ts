import { Dispatch, Reducer, useCallback, useReducer, useState, } from 'react'
import AsyncValidator, { Rules, RuleItem, ValidateSource, ErrorList } from 'async-validator'

export { ErrorList } from 'async-validator'

// Action
export type FiledInputEvent = 'blur' | 'change'
export interface FieldInputAction<K = string> {
  name: K
  event: FiledInputEvent
  value: any
}
export interface FieldStateAction {
  event: 'submit'
  value?: any
}
export type FieldAction<K = string> = FieldInputAction<K> | FieldStateAction

// Model
export interface FieldModel<K = string> {
  name: K
  value: any
  errors?: ErrorList
  dispatch: Dispatch<FieldInputAction<K>>
}
export type ModelMap<K = string> = Map<K, FieldModel<K>>

// Extend Rules
export interface FiledRuleItem extends RuleItem {
  target?: FiledInputEvent
}
export interface FiledRules extends Rules {
  [field: string]: FiledRuleItem | FiledRuleItem[]
}

/**
 * validator hook
 * @param state 
 * @param rule        // validate rule of async-validator
 * @param callback
 * @param errorCallback
 */
export interface useValidator {
  <S = ValidateSource>(
    initState: S,
    rules: FiledRules,
    callback: (state: S) => void,
    errorCallback?: (error: Map<string, ErrorList>) => void
    ): [ModelMap<keyof S>, () => void]
}

export const useValidator: useValidator = <S>(
  state: S,
  rules: FiledRules,
  callback: (state: S) => void,
  errorCallback?: (error: Map<string, ErrorList>) => void
): [ModelMap<keyof S>, () => void] => {
  type FileName = keyof S
  type ErrorMap = Map<FileName, ErrorList>
  const [errorMap, setErrorMap] = useState<ErrorMap>(new Map())

  /**
   * memoized filed rule is matching event
   */
  const isValidate = useCallback((filed: FileName, event: FiledInputEvent) => {
    const rule = rules[filed as string]
    let ruleList = Array.isArray(rule) ? rule : [rule]
    let validate = false
    ruleList.forEach((config) => {
      if (config.target === undefined || config.target === event) {
        validate = true
        return
      }
    })
    return validate
  }, [rules])

  /**
   * memoized validate exection
   */
  const onValidation = useCallback((source: ValidateSource) => {
    const filedNames = Object.keys(source)
    const filterRules: FiledRules = {}
    for (let fileName of filedNames) {
      filterRules[fileName] = rules[fileName]
    }
    const validator = new AsyncValidator(filterRules)
    return validator.validate(source, {}, (errors, fields) => {
      setErrorMap((errorMap) => {
        const fieldErrors = fields || {}
        for (let fileName of filedNames) {
          errorMap.set(fileName as FileName, fieldErrors[fileName])
        }
        return new Map(errorMap)
      })
    })
  }, [rules])

  /**
   * memoized reducer callback
   */
  const reducerCallback = useCallback((prevState: S, action: FieldAction<FileName>) => {
    // validate & update state
    switch (action.event) {
      case 'change':
      case 'blur':
        if (isValidate(action.name, action.event)) {
          onValidation({ [action.name]: action.value })
        }
        return { ...prevState, [action.name]: action.value }
      default:
    }

    // validate all state
    if (action.event === 'submit') {
      onValidation(prevState)
        .then(() => callback(prevState))
        .catch(({fields}) => {
          if (errorCallback) {
            errorCallback(fields)
          }
        })
    }

    return prevState
  }, [ isValidate, onValidation, callback, errorCallback ])
  const [reducerState, dispatch] = useReducer<Reducer<S, FieldAction<FileName>>>(reducerCallback, state)

  const modelMap: ModelMap<FileName> = new Map()
  const filedNames = Object.keys(reducerState) as Array<FileName>
  for (let filedName of filedNames) {
    const fileModel: FieldModel<FileName> = {
      name: filedName,
      value: reducerState[filedName],
      errors: errorMap.get(filedName),
      dispatch,
    }
    modelMap.set(filedName, fileModel)
  }

  const submitHandle = useCallback(() => dispatch({ event: 'submit' }), [dispatch])

  return [modelMap, submitHandle]
}
