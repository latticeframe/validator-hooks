import { useCallback, useReducer, useState, } from 'react';
import AsyncValidator from 'async-validator';
export const useValidator = (state, rules, callback, errorCallback) => {
    const [errorMap, setErrorMap] = useState(new Map());
    /**
     * memoized field rule is matching event
     */
    const isValidate = useCallback((field, event) => {
        const rule = rules[field];
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
        const fieldNames = Object.keys(source);
        const filterRules = {};
        for (let fieldName of fieldNames) {
            filterRules[fieldName] = rules[fieldName];
        }
        const validator = new AsyncValidator(filterRules);
        return validator.validate(source, {}, (errors, fields) => {
            setErrorMap((errorMap) => {
                const fieldErrors = fields || {};
                for (let fieldName of fieldNames) {
                    errorMap.set(fieldName, fieldErrors[fieldName]);
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
                return Object.assign({}, prevState, { [action.name]: action.value });
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
    const fieldNames = Object.keys(reducerState);
    for (let fieldName of fieldNames) {
        const fieldModel = {
            name: fieldName,
            value: reducerState[fieldName],
            errors: errorMap.get(fieldName),
            dispatch,
        };
        modelMap.set(fieldName, fieldModel);
    }
    const submitHandle = useCallback(() => dispatch({ event: 'submit' }), [dispatch]);
    return [modelMap, submitHandle];
};
