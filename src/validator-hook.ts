import { Dispatch, Reducer, useCallback, useReducer, useState, } from 'react'
import AsyncValidator, { Rules, RuleItem, ValidateSource, ErrorList } from 'async-validator'

export { ErrorList } from 'async-validator'

// Action
export type FieldInputEvent = 'blur' | 'change'
export interface FieldInputAction<K = string> {
  name: K
  event: FieldInputEvent
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
export interface FieldInputProps {
  model?: FieldModel
}
export type ModelMap<K = string> = Map<K, FieldModel<K>>

// Extend Rules
export interface FieldRuleItem extends RuleItem {
  target?: FieldInputEvent
}
export interface FieldRules extends Rules {
  [field: string]: FieldRuleItem | FieldRuleItem[]
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
    rules: FieldRules,
    callback: (state: S) => void,
    errorCallback?: (error: Map<string, ErrorList>) => void
    ): [ModelMap<keyof S>, () => void]
}

export const useValidator: useValidator = <S>(
  state: S,
  rules: FieldRules,
  callback: (state: S) => void,
  errorCallback?: (error: Map<string, ErrorList>) => void
): [ModelMap<keyof S>, () => void] => {
  type FieldName = keyof S
  type ErrorMap = Map<FieldName, ErrorList>
  const [errorMap, setErrorMap] = useState<ErrorMap>(new Map())

  /**
   * memoized field rule is matching event
   */
  const isValidate = useCallback((field: FieldName, event: FieldInputEvent) => {
    const rule = rules[field as string]
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
    const fieldNames = Object.keys(source)
    const filterRules: FieldRules = {}
    for (let fieldName of fieldNames) {
      filterRules[fieldName] = rules[fieldName]
    }
    const validator = new AsyncValidator(filterRules)
    return validator.validate(source, {}, (errors, fields) => {
      setErrorMap((errorMap) => {
        const fieldErrors = fields || {}
        for (let fieldName of fieldNames) {
          errorMap.set(fieldName as FieldName, fieldErrors[fieldName])
        }
        return new Map(errorMap)
      })
    })
  }, [rules])

  /**
   * memoized reducer callback
   */
  const reducerCallback = useCallback((prevState: S, action: FieldAction<FieldName>) => {
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
  const [reducerState, dispatch] = useReducer<Reducer<S, FieldAction<FieldName>>>(reducerCallback, state)

  const modelMap: ModelMap<FieldName> = new Map()
  const fieldNames = Object.keys(reducerState) as Array<FieldName>
  for (let fieldName of fieldNames) {
    const fieldModel: FieldModel<FieldName> = {
      name: fieldName,
      value: reducerState[fieldName],
      errors: errorMap.get(fieldName),
      dispatch,
    }
    modelMap.set(fieldName, fieldModel)
  }

  const submitHandle = useCallback(() => dispatch({ event: 'submit' }), [dispatch])

  return [modelMap, submitHandle]
}
