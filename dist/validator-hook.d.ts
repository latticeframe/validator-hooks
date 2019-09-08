import { Dispatch } from 'react';
import { Rules, RuleItem, ValidateSource, ErrorList } from 'async-validator';
export { ErrorList } from 'async-validator';
export declare type FiledInputEvent = 'blur' | 'change';
export interface FieldInputAction<K = string> {
    name: K;
    event: FiledInputEvent;
    value: any;
}
export interface FieldStateAction {
    event: 'submit';
    value?: any;
}
export declare type FieldAction<K = string> = FieldInputAction<K> | FieldStateAction;
export interface FieldModel<K = string> {
    name: K;
    value: any;
    errors?: ErrorList;
    dispatch: Dispatch<FieldInputAction<K>>;
}
export declare type ModelMap<K = string> = Map<K, FieldModel<K>>;
export interface FiledRuleItem extends RuleItem {
    target?: FiledInputEvent;
}
export interface FiledRules extends Rules {
    [field: string]: FiledRuleItem | FiledRuleItem[];
}
/**
 * validator hook
 * @param state
 * @param rule        // validate rule of async-validator
 * @param callback
 * @param errorCallback
 */
export interface useValidator<S = ValidateSource> {
    (initState: S, rules: FiledRules, callback: (state: S) => void, errorCallback?: (error: Map<string, ErrorList>) => void): [ModelMap<keyof S>, () => void];
}
export declare const useValidator: useValidator;
//# sourceMappingURL=validator-hook.d.ts.map