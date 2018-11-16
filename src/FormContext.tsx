import React from "react";
import * as Yup from "yup";
import { DataItemType } from "./DataType";


export type ValidationErrors<OriginalData, DataItem = DataItemType<OriginalData>> = { [name in keyof DataItem]?: Yup.ValidationError };

export interface FormContextUtilities<OriginalData, DataItem = DataItemType<OriginalData>> {

    submit(): Promise<void>;
    add(datum: DataItem): Promise<void>;
    setFieldValue(index: number, name: keyof DataItem, value: DataItem[typeof name]): Promise<void>;
}

export interface FormContext<OriginalData> {

    form: FormContextUtilities<OriginalData>;
    immutable: boolean;
    index: number;
    data: OriginalData;
    validationErrors: ValidationErrors<OriginalData>;
    schema?: Yup.ArraySchema<DataItemType<OriginalData>>;
}

export type UsesFormContext<OriginalData> = FormContext<OriginalData>;

const { Provider, Consumer } = React.createContext<FormContext<any>>(null);

export const FormProvider = Provider;
export const FormConsumer = Consumer;

export function withForm<OriginalData = any, Props extends FormContext<OriginalData> = FormContext<OriginalData>>(Component: React.ComponentType<Props>) {

    return class ComponentWithFormContext extends React.PureComponent {

        public render() {

            return <FormConsumer>
            {
                (context: FormContext<OriginalData>) => <Component
                    {...this.props}
                    {...context}
                />
            }
            </FormConsumer>;
        }
    }
}
