import { Dispatch } from 'react';
import { Rules, RuleItem, ValidateSource, ErrorList } from 'async-validator';
export { ErrorList } from 'async-validator';
export declare type FieldInputEvent = 'blur' | 'change';
export interface FieldInputAction<K = string> {
    name: K;
    event: FieldInputEvent;
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
export interface FieldInputProps {
    model?: FieldModel;
}
export declare type ModelMap<K = string> = Map<K, FieldModel<K>>;
export interface FieldRuleItem extends RuleItem {
    target?: FieldInputEvent;
}
export interface FieldRules extends Rules {
    [field: string]: FieldRuleItem | FieldRuleItem[];
}
/**
 * validator hook
 * @param state
 * @param rule        // validate rule of async-validator
 * @param callback
 * @param errorCallback
 */
export interface useValidator {
    <S = ValidateSource>(initState: S, rules: FieldRules, callback: (state: S) => void, errorCallback?: (error: Map<string, ErrorList>) => void): [ModelMap<keyof S>, () => void];
}
export declare const useValidator: useValidator;
//# sourceMappingURL=validator-hook.d.ts.map