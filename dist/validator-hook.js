import { useCallback, useReducer, useState, } from 'react';
import AsyncValidator from 'async-validator';
export const useValidator = (state, rules, callback, errorCallback) => {
    const [errorMap, setErrorMap] = useState(new Map());
    /**
     * memoized filed rule is matching event
     */
    const isValidate = useCallback((filed, event) => {
        const rule = rules[filed];
        let ruleList = Array.isArray(rule) ? rule : [rule];
        let validate = false;
        ruleList.forEach((config) => {
            if (config.target === undefined || config.target === event) {
                validate = true;
                return;
            }
        });
        return validate;
    }, [rules]);
    /**
     * memoized validate exection
     */
    const onValidation = useCallback((source) => {
        const filedNames = Object.keys(source);
        const filterRules = {};
        for (let fileName of filedNames) {
            filterRules[fileName] = rules[fileName];
        }
        const validator = new AsyncValidator(filterRules);
        return validator.validate(source, {}, (errors, fields) => {
            setErrorMap((errorMap) => {
                const fieldErrors = fields || {};
                for (let fileName of filedNames) {
                    errorMap.set(fileName, fieldErrors[fileName]);
                }
                return new Map(errorMap);
            });
        });
    }, [rules]);
    /**
     * memoized reducer callback
     */
    const reducerCallback = useCallback((prevState, action) => {
        // validate & update state
        switch (action.event) {
            case 'change':
            case 'blur':
                if (isValidate(action.name, action.event)) {
                    onValidation({ [action.name]: action.value });
                }
                return Object.assign(Object.assign({}, prevState), { [action.name]: action.value });
            default:
        }
        // validate all state
        if (action.event === 'submit') {
            onValidation(prevState)
                .then(() => callback(prevState))
                .catch(({ fields }) => {
                if (errorCallback) {
                    errorCallback(fields);
                }
            });
        }
        return prevState;
    }, [isValidate, onValidation, callback, errorCallback]);
    const [reducerState, dispatch] = useReducer(reducerCallback, state);
    const modelMap = new Map();
    const filedNames = Object.keys(reducerState);
    for (let filedName of filedNames) {
        const fileModel = {
            name: filedName,
            value: reducerState[filedName],
            errors: errorMap.get(filedName),
            dispatch,
        };
        modelMap.set(filedName, fileModel);
    }
    const submitHandle = useCallback(() => dispatch({ event: 'submit' }), [dispatch]);
    return [modelMap, submitHandle];
};
